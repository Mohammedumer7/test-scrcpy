export declare const mimeType = "video/mp4; codecs=\"avc1.42E01E\"";
export { setLogger } from './util/debug';
export default class VideoConverter {
    private element;
    private fps;
    private fpf;
    private mediaSource;
    private receiveBuffer;
    private remuxer;
    private mediaReady;
    private mediaReadyPromise;
    private queue;
    sourceBuffer: SourceBuffer;
    static readonly errorNotes: {
        [x: number]: string;
    };
    constructor(element: HTMLVideoElement, fps?: number, fpf?: number);
    private setup;
    play(): void;
    pause(): void;
    reset(): void;
    appendRawData(data: ArrayLike<number>): void;
    private writeFragment;
    private writeBuffer;
    private doAppend;
}
