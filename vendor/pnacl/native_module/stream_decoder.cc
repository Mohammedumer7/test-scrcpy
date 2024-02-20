#include <GLES2/gl2.h>

#include "ppapi/cpp/instance.h"
#include "ppapi/cpp/module.h"
#include "ppapi/cpp/var.h"
#include "ppapi/cpp/completion_callback.h"
#include "ppapi/cpp/var_array_buffer.h"
#include "ppapi/cpp/websocket.h"
#include "ppapi/cpp/video_decoder.h"
#include "ppapi/utility/completion_callback_factory.h"
#include "ppapi/c/ppb_opengles2.h"
#include "ppapi/cpp/graphics_3d.h"
#include "ppapi/cpp/input_event.h"
#include "ppapi/cpp/mouse_cursor.h"

#include <memory>
#include <iostream>
#include <queue>
#include <sstream>
#include <vector>
#include <array>
#include <numeric>

//#define MDEBUG
//#define INITIAL_CONFIG
//#define PRINT_DEBUG_INFO
#define FPS_COUNT
//#define PRINT_STAT

using namespace std;

class decoder;

class drawer;

struct shader_t {
    shader_t() : program(0), texcoord_scale_location(0) {}

    ~shader_t() {}

    GLuint program;
    GLint texcoord_scale_location;
};

class stream_decoder : public pp::Instance {
public:
    explicit stream_decoder(PP_Instance instance);

    void HandleMessage(const pp::Var& var_message) override;

    void init_drawer_and_decoder(pp::Size size);

    void DidChangeView(const pp::View& view) override;

    void resize(pp::Size const& size);

    void paint_picture(PP_VideoPicture const& picture) const;

    void recycle_picture(PP_VideoPicture const& picture) const;

    void on_decoder_initialized();

private:
    void connect_to_server(std::string const& address);

    void on_connect_completion(int32_t result);

    void on_receive_completion(int32_t result);

    void handle_message();

    void receive();

private:
    unique_ptr<pp::WebSocket> stream_websocket_;
    pp::CompletionCallbackFactory <stream_decoder> cb_factory_;
    pp::Var receive_var_;
    unique_ptr<decoder> decoder_;
    unique_ptr<drawer> drawer_;
    pp::Size canvas_size_;
    bool is_connected_;
    string stream_address_;
};

typedef vector<uint8_t> decode_frame_t;

class decoder {
public:
    explicit decoder(stream_decoder* instance, const pp::Graphics3D& graphics_3d);

    void decode_frame(const uint8_t* buffer, uint32_t size);

    void recycle_picture(const PP_VideoPicture& picture) const;

private:
    void on_initialize(uint32_t result);

    void on_decode_done(uint32_t result);

    void on_picture_decoded(int32_t result, PP_VideoPicture picture);

    void decode_next_frame();

    static constexpr uint32_t max_element_latency_size = 512;
    typedef array<double, max_element_latency_size> latency_array_t;
    static constexpr uint32_t interval_n = 13;
    typedef array<uint32_t, interval_n> stat_array_t;

private:
    stream_decoder* instance_;
    const PPB_Core* core_;
    unique_ptr<pp::VideoDecoder> decoder_;
    pp::CompletionCallbackFactory <decoder> cb_factory_;
    uint32_t frame_n_ = 0;
    uint64_t received_frames_ = 0;
    uint32_t decoded_frames_ = 0;
    queue<decode_frame_t> frames_;
    bool is_decoding_ = false;
    bool resetting_ = false;

    uint64_t on_decode_done_frames_ = 0;

    double last_measured_time = 0;
    uint64_t decode_frames_last_sec = 0;


    latency_array_t decode_latency_ = {0};
    stat_array_t stats_ = {0};
};

class drawer {
public:
    explicit drawer(stream_decoder* instance, pp::Size size);

    void paint_picture(const PP_VideoPicture& picture);

    pp::Graphics3D* get_context() const;

private:
    void init_shaders();

    void init_gl_context();

    void create_program();

    void create_fragment_shader() const;

    void create_vertex_shader() const;

    void create_shader(GLuint program, GLenum type, const char* source, int size) const;

    void paint_next_picture();

    void on_paint_finished(uint32_t result);

    inline void assertNoGLError() const;

private:
    stream_decoder* instance_;
    pp::Graphics3D* context_;
    pp::Size viewport_size_;
    const PPB_OpenGLES2* gles2_;
    shader_t shader_;
    bool is_drawing_ = false;
    queue<PP_VideoPicture> pending_pictures_;
    pp::CompletionCallbackFactory <drawer> cb_factory_;

    const char* vertex_shader_ = R"foo(
        varying vec2 v_texCoord;
        attribute vec4 a_position;
        attribute vec2 a_texCoord;
        uniform vec2 v_scale;
        void main()
        {
            v_texCoord = v_scale * a_texCoord;
            gl_Position = a_position;
        })foo";

    const char* fragment_shader_ = R"foo(
        precision mediump float;
        varying vec2 v_texCoord;
        uniform sampler2D s_texture;
        void main()
        {
            gl_FragColor = texture2D(s_texture, v_texCoord);
        })foo";
};


drawer::drawer(stream_decoder* instance, pp::Size size)
        : instance_(instance),
          context_(nullptr),
          viewport_size_(size),
          gles2_(static_cast<const PPB_OpenGLES2*>( pp::Module::Get()->GetBrowserInterface(
                  PPB_OPENGLES2_INTERFACE))),
          cb_factory_(this) {
    init_gl_context();

    assertNoGLError();

    gles2_->ClearColor(context_->pp_resource(), 0, 0, 0, 1);
    gles2_->Clear(context_->pp_resource(), GL_COLOR_BUFFER_BIT);

    init_shaders();
}


void drawer::paint_picture(const PP_VideoPicture& picture) {
    pending_pictures_.push(picture);

    if (!is_drawing_)
        paint_next_picture();
}


pp::Graphics3D* drawer::get_context() const {
    return context_;
}


void drawer::init_gl_context() {
    int32_t context_attributes[] = {
            PP_GRAPHICS3DATTRIB_ALPHA_SIZE, 8,
            PP_GRAPHICS3DATTRIB_BLUE_SIZE, 8,
            PP_GRAPHICS3DATTRIB_GREEN_SIZE, 8,
            PP_GRAPHICS3DATTRIB_RED_SIZE, 8,
            PP_GRAPHICS3DATTRIB_DEPTH_SIZE, 0,
            PP_GRAPHICS3DATTRIB_STENCIL_SIZE, 0,
            PP_GRAPHICS3DATTRIB_SAMPLES, 0,
            PP_GRAPHICS3DATTRIB_SAMPLE_BUFFERS, 0,
            PP_GRAPHICS3DATTRIB_WIDTH, viewport_size_.width(),
            PP_GRAPHICS3DATTRIB_HEIGHT, viewport_size_.height(),
            PP_GRAPHICS3DATTRIB_NONE,
    };
    context_ = new pp::Graphics3D(instance_, context_attributes);
    assert(!context_->is_null());
    assert(instance_->BindGraphics(*context_));
}


void drawer::create_program() {
    shader_.program = gles2_->CreateProgram(context_->pp_resource());
    create_vertex_shader();
    create_fragment_shader();

    gles2_->LinkProgram(context_->pp_resource(), shader_.program);
    gles2_->UseProgram(context_->pp_resource(), shader_.program);
    gles2_->Uniform1i(
            context_->pp_resource(),
            gles2_->GetUniformLocation(
                    context_->pp_resource(), shader_.program, "s_texture"),
            0);

    assertNoGLError();

    shader_.texcoord_scale_location = gles2_->GetUniformLocation(
            context_->pp_resource(), shader_.program, "v_scale");

    GLint pos_location = gles2_->GetAttribLocation(
            context_->pp_resource(), shader_.program, "a_position");
    GLint tc_location = gles2_->GetAttribLocation(
            context_->pp_resource(), shader_.program, "a_texCoord");

    assertNoGLError();

    gles2_->EnableVertexAttribArray(context_->pp_resource(), pos_location);
    gles2_->VertexAttribPointer(
            context_->pp_resource(), pos_location, 2, GL_FLOAT, GL_FALSE, 0, nullptr);
    gles2_->EnableVertexAttribArray(context_->pp_resource(), tc_location);
    gles2_->VertexAttribPointer(
            context_->pp_resource(),
            tc_location,
            2,
            GL_FLOAT,
            GL_FALSE,
            0,
            static_cast<float*>(nullptr) + 8);  // Skip position coordinates.

    gles2_->UseProgram(context_->pp_resource(), 0);
    assertNoGLError();
}


void drawer::create_fragment_shader() const {
    create_shader(shader_.program, GL_FRAGMENT_SHADER, fragment_shader_, strlen(fragment_shader_));
}


void drawer::create_vertex_shader() const {
    create_shader(shader_.program, GL_VERTEX_SHADER, vertex_shader_, strlen(vertex_shader_));
}


void drawer::create_shader(GLuint program,
                           GLenum type,
                           const char* source,
                           int size) const {
    GLuint shader = gles2_->CreateShader(context_->pp_resource(), type);
    gles2_->ShaderSource(context_->pp_resource(), shader, 1, &source, &size);
    gles2_->CompileShader(context_->pp_resource(), shader);
    gles2_->AttachShader(context_->pp_resource(), program, shader);
    gles2_->DeleteShader(context_->pp_resource(), shader);
}


void drawer::paint_next_picture() {
    assert(!is_drawing_);
    is_drawing_ = true;

    const PP_VideoPicture& picture = pending_pictures_.front();

    if (picture.texture_target != GL_TEXTURE_2D)
    {
        is_drawing_ = false;

        instance_->recycle_picture(picture);
        return;
    }

    PP_Resource graphics_3d = context_->pp_resource();

    gles2_->UseProgram(graphics_3d, shader_.program);
    gles2_->Uniform2f(graphics_3d, shader_.texcoord_scale_location, 1.0, 1.0);

    gles2_->Viewport(graphics_3d, 0, 0, viewport_size_.width(), viewport_size_.height());
    gles2_->ActiveTexture(graphics_3d, GL_TEXTURE0);
    gles2_->BindTexture(graphics_3d, picture.texture_target, picture.texture_id);
    gles2_->DrawArrays(graphics_3d, GL_TRIANGLE_STRIP, 0, 4);
    gles2_->UseProgram(graphics_3d, 0);

    context_->SwapBuffers(cb_factory_.NewCallback(&drawer::on_paint_finished));
}


void drawer::on_paint_finished(uint32_t result) {
    assert(result == PP_OK);
    is_drawing_ = false;

    if (pending_pictures_.empty())
        return;

    const PP_VideoPicture& picture = pending_pictures_.front();
    instance_->recycle_picture(picture);
    pending_pictures_.pop();

    if (!pending_pictures_.empty())
        paint_next_picture();
}


void drawer::assertNoGLError() const {
    assert(!gles2_->GetError(context_->pp_resource()));
}


void drawer::init_shaders() {
    static const float vertices[] = {
            -1, -1, -1, 1, 1, -1, 1, 1,     // Position coordinates.
            0, 1, 0, 0, 1, 1, 1, 0,     // Texture coordinates.
    };

    GLuint buffer;
    gles2_->GenBuffers(context_->pp_resource(), 1, &buffer);
    gles2_->BindBuffer(context_->pp_resource(), GL_ARRAY_BUFFER, buffer);

    gles2_->BufferData(context_->pp_resource(),
                       GL_ARRAY_BUFFER,
                       sizeof(vertices),
                       vertices,
                       GL_STATIC_DRAW);

    assertNoGLError();
    create_program();
}


decoder::decoder(stream_decoder* instance, const pp::Graphics3D& graphics_3d)
        : instance_(instance), core_(static_cast<const PPB_Core*>(
                                             pp::Module::Get()->GetBrowserInterface(PPB_CORE_INTERFACE))),
          decoder_(new pp::VideoDecoder(instance)), cb_factory_(this) {
    decoder_->Initialize(
            graphics_3d,
            PP_VIDEOPROFILE_H264BASELINE,
            PP_HARDWAREACCELERATION_WITHFALLBACK,
            0,
            cb_factory_.NewCallback(&decoder::on_initialize));
}

void decoder::decode_frame(const uint8_t* buffer, uint32_t size) {
    assert(decoder_);
    if (resetting_)
        return;

#ifdef INITIAL_CONFIG
    decode_latency_[received_frames_ % max_element_latency_size] = core_->GetTimeTicks() * 1000;
    //decode_latency_[received_frames_ % max_element_latency_size] = core_->GetTimeTicks();
#endif // INITIAL_CONFIG


#ifdef PRINT_DEBUG_INFO
    {
        ostringstream ssdebug2;
        ssdebug2 << received_frames_;
        ssdebug2 << "   decode_frame: recieved frame ";
        instance_->PostMessage(ssdebug2.str());
    }
#endif // PRINT_DEBUG_INFO

    ++received_frames_;
    frames_.emplace(buffer, buffer + size);

    if (!is_decoding_)
        decode_next_frame();
}


void decoder::recycle_picture(const PP_VideoPicture& picture) const {
    assert(decoder_);

    decoder_->RecyclePicture(picture);
}


void decoder::on_initialize(uint32_t result) {
    assert(result == PP_OK);
    assert(decoder_);
    assert(!decoder_->is_null());
//    instance_->PostMessage("Decoder Initialized");
    decoder_->GetPicture(cb_factory_.NewCallbackWithOutput(&decoder::on_picture_decoded));
    instance_->on_decoder_initialized();
}

void decoder::on_decode_done(uint32_t result) { // TODO MB HERE END
    assert(decoder_);
    is_decoding_ = false;

#ifdef PRINT_DEBUG_INFO
    {
        ostringstream ssdebug2;
        ssdebug2 << on_decode_done_frames_;
        ssdebug2 << "   on_decode_done    ";
        instance_->PostMessage(ssdebug2.str());
    }

    on_decode_done_frames_++;
#endif //PRINT_DEBUG_INFO

#ifdef MDEBUG
    auto decode_latency =
            core_->GetTimeTicks() * 1000
            - decode_latency_[decoded_frames_ % max_element_latency_size];
    ++decoded_frames_;


    {
        ostringstream ssdebug2;
        ssdebug2 << decoded_frames_ - 1;
        ssdebug2 << "   lat:    ";
        ssdebug2 << decode_latency;
        instance_->PostMessage(ssdebug2.str());
    }

    double time = 5.0;
    for (uint32_t i = 0; i < interval_n; ++i)
    {

        if (i == 12)
        {
            /*
            ostringstream ssdebug2;
            ssdebug2 << "long:    ";
            ssdebug2 << decode_latency * 1000;
            instance_->PostMessage(ssdebug2.str());
            */
            ++stats_[i];
            break;
        }


        if (decode_latency > time)
        {
            time += 5.0;
            continue;
        }


        ++stats_[i];
        break;
    }
#endif


    if (result != PP_OK)
    {
        instance_->PostMessage("Error occured while decoding");
    }

    if (frames_.empty())
        return;
    frames_.pop();
    if (!frames_.empty())
        decode_next_frame();
}


void decoder::on_picture_decoded(int32_t result, PP_VideoPicture picture) {
    assert(decoder_);

    if (result == PP_ERROR_ABORTED)
        return;

    assert(result == PP_OK);

    ++decoded_frames_;

#ifdef INITIAL_CONFIG
    auto decode_latency =
            core_->GetTimeTicks() * 1000
            - decode_latency_[picture.decode_id % max_element_latency_size];

    double time = 5.0;
    for (uint32_t i = 0; i < interval_n; ++i)
    {
        if (i == 12)
        {
            ++stats_[i];
            break;
        }

        if (decode_latency > time)
        {
            time += 5.0;
            continue;
        }

        ++stats_[i];
        break;
    }
#endif


#ifdef PRINT_DEBUG_INFO

     /*
     auto decode_latency_dbg =
            core_->GetTimeTicks() * 1000
            - decode_latency_[picture.decode_id % max_element_latency_size];
     */
    {
        ostringstream ssdebug2;
        ssdebug2 << picture.decode_id;
        //ssdebug2 << "   on_pic_decoded lat:    ";
        //ssdebug2 << decode_latency_dbg;
        ssdebug2 << "  decoded  frame ";
        ssdebug2 << decoded_frames_ - 1;
        instance_->PostMessage(ssdebug2.str());
    }

#endif // PRINT_DEBUG_INFO

#ifdef FPS_COUNT
    double curTime = core_->GetTimeTicks() * 1000;
    if (curTime - last_measured_time > 1000.0)
    {
        ostringstream ssdebug3;
        ssdebug3 << decoded_frames_ - decode_frames_last_sec;
        ssdebug3 << "   fps";
        instance_->PostMessage(ssdebug3.str());

        decode_frames_last_sec = decoded_frames_;
        last_measured_time = curTime;
    }
#endif // FPS_COUNT

#ifdef PRINT_STAT
    if (decoded_frames_ > 2639)
    {
        ostringstream ss;
        ss << picture.decode_id;
        ss << "     stat: ";
        for (auto item : stats_)
        {
            ss << item;
            ss << " ";
        }
        instance_->PostMessage(ss.str());
    }
#endif // PRINT_STAT

    decoder_->GetPicture(cb_factory_.NewCallbackWithOutput(&decoder::on_picture_decoded));
    instance_->paint_picture(picture);
}

void decoder::decode_next_frame() {
    assert(!is_decoding_);

    is_decoding_ = true;
#ifdef PRINT_DEBUG_INFO
    {
        ostringstream ssdebug2;
        ssdebug2 << frame_n_;
        ssdebug2 << "   dnext frame    ";
        instance_->PostMessage(ssdebug2.str());
    }
#endif // PRINT_DEBUG_INFO

#ifdef MDEBUG
    decode_latency_[frame_n_ % max_element_latency_size] = core_->GetTimeTicks() * 1000;
#endif // MDEBUG

    const decode_frame_t& frame = frames_.front();


    decoder_->Decode(frame_n_++, frame.size(), frame.data(), cb_factory_.NewCallback(&decoder::on_decode_done));
}

stream_decoder::stream_decoder(PP_Instance instance)
        : Instance(instance), stream_websocket_(nullptr), cb_factory_(this), decoder_(nullptr), drawer_(nullptr),
          is_connected_(false) {
}

void stream_decoder::HandleMessage(const pp::Var& var_message) {
    if (var_message.is_string())
    {
        std::string msg = var_message.AsString();
        if (msg.size() > 5 && msg.substr(0, 4) == "CONN")
        {
            istringstream ss(msg.substr(4));
            ss >> stream_address_;

            connect_to_server(stream_address_);
        }
    }
}

bool check_flag(uint32_t flag, uint32_t flags) {
    return bool(flags & flag);
}

void stream_decoder::init_drawer_and_decoder(pp::Size size) {
    // ReSharper disable CppSmartPointerVsMakeFunction
//    drawer_.reset(new drawer(this, size));
    drawer_.reset(new drawer(this, size));
    decoder_.reset(new decoder(this, *drawer_->get_context()));
    // ReSharper restore CppSmartPointerVsMakeFunction
}

void stream_decoder::DidChangeView(const pp::View& view) {
    auto size = view.GetRect().size();

    resize(size);
}

void stream_decoder::resize(pp::Size const& size) {
    if (canvas_size_ == size)
        return;

    canvas_size_ = size;

    init_drawer_and_decoder(size);
}

void stream_decoder::on_connect_completion(int32_t result) {
    if (result != PP_OK)
    {
        PostMessage("connection failed: " + std::to_string(result));
        return;
    }

    is_connected_ = true;
    PostMessage("Connected");

    receive();
}


void stream_decoder::on_receive_completion(int32_t result) {
    if (result == PP_OK)
    {
        handle_message();
    }
    receive();
}


void stream_decoder::handle_message() {
    if (receive_var_.is_array_buffer())
    {
        pp::VarArrayBuffer array_buffer(receive_var_);
        uint8_t* data = static_cast<uint8_t*>(array_buffer.Map());
        decoder_->decode_frame(data, array_buffer.ByteLength());
        array_buffer.Unmap();
    }
}


void stream_decoder::receive() {
    stream_websocket_->ReceiveMessage(&receive_var_, cb_factory_.NewCallback(&stream_decoder::on_receive_completion));
}


void stream_decoder::connect_to_server(std::string const& address) {
    stream_websocket_.reset(new pp::WebSocket(this));
    stream_websocket_->Connect(address, nullptr, 0, cb_factory_.NewCallback(&stream_decoder::on_connect_completion));
}


void stream_decoder::paint_picture(PP_VideoPicture const& picture) const {
    drawer_->paint_picture(picture);
}


void stream_decoder::recycle_picture(PP_VideoPicture const& picture) const {
    decoder_->recycle_picture(picture);
}

void stream_decoder::on_decoder_initialized() {
    RequestInputEvents(PP_INPUTEVENT_CLASS_MOUSE | PP_INPUTEVENT_CLASS_WHEEL | PP_INPUTEVENT_CLASS_KEYBOARD);
}

class StreamDecoderModule : public pp::Module {
public:
    StreamDecoderModule() : Module() {}

    virtual ~StreamDecoderModule() {}

    pp::Instance* CreateInstance(PP_Instance instance) override {
        return new stream_decoder(instance);
    }
};


namespace pp {
    Module* CreateModule() {
        return new StreamDecoderModule();
    }
};  // namespace pp
