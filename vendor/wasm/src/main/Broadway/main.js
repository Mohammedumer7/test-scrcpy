var arr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var i = 0;

var WorkerMode = false;

//window.onload = runClient();

function updateStat(response) {
    if (response < 20) {
        if (response < 5)
            arr[0] = arr[0] + 1;
        else if (response < 10) {
            arr[1] = arr[1] + 1;
        } else if (response < 15) {
            arr[2] = arr[2] + 1;
        } else {
            arr[3] = arr[3] + 1;
        }
    } else {
        if (response < 25) {
            arr[4] = arr[4] + 1;
        } else if (response < 30) {
            arr[5] = arr[5] + 1;
        } else if (response < 35) {
            arr[6] = arr[6] + 1;
        } else if (response < 40){
            arr[7] = arr[7] + 1;
        }else if (response < 45){
            arr[8] = arr[8] + 1;
        }else if (response < 50){
            arr[9] = arr[9] + 1;
        }else if (response < 55){
            arr[10] = arr[10] + 1;
        }else if (response < 60){
            arr[11] = arr[11] + 1;
        }else {
            arr[12] = arr[12] + 1;
        }

    }

}
//window.onload = runClient();


//workerFile: "Broadway/Decoder.js",
function runClient() {
    let player = new Player({
            reuseMemory: true,
            useWorker: false,
            //useWorker: true,
            //workerFile: "Broadway/Decoder.js",
            size: {width: 1920, height: 912}
        }
    )

    player.onRenderFrameComplete = (info) => {
        let decodeTime = info.infos[0];
        let response = decodeTime.finishDecoding - decodeTime.startDecoding;
        updateStat(response);

        i += 1;
        if (i > 2639) {
            console.warn(arr)
        }
    }

    document.body.appendChild(player.canvas)

    ws = new WebSocket('ws://localhost:8080');
    ws.binaryType = "arraybuffer";

    ws.onopen = function () {
        console.log("Started");
    };

    ws.onmessage = function (e) {
        player.decode(new Uint8Array(e.data), {})
        //console.log(new Uint8Array(e.data).length)
    }
}