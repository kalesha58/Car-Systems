type RecordBackEvent = { currentPosition: number };

/**
 * Web audio recorder using MediaRecorder.
 */
export default class AudioRecorderPlayer {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: BlobPart[] = [];
  private stream: MediaStream | null = null;
  private startedAt = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private recordListener: ((e: RecordBackEvent) => void) | null = null;
  private objectUrl: string | null = null;

  mmssss(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const m = String(Math.floor(totalSec / 60)).padStart(2, '0');
    const s = String(totalSec % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  addRecordBackListener(listener: (e: RecordBackEvent) => void): void {
    this.recordListener = listener;
  }

  removeRecordBackListener(): void {
    this.recordListener = null;
  }

  async startRecorder(_path?: string): Promise<string> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.chunks = [];
    this.mediaRecorder = new MediaRecorder(this.stream);
    this.mediaRecorder.ondataavailable = event => {
      if (event.data.size > 0) this.chunks.push(event.data);
    };
    this.mediaRecorder.start(200);
    this.startedAt = Date.now();
    this.timer = setInterval(() => {
      this.recordListener?.({ currentPosition: Date.now() - this.startedAt });
    }, 200);
    return 'web-recording';
  }

  async stopRecorder(): Promise<string> {
    return new Promise(resolve => {
      if (!this.mediaRecorder) {
        resolve('');
        return;
      }
      this.mediaRecorder.onstop = () => {
        if (this.timer) clearInterval(this.timer);
        this.stream?.getTracks().forEach(t => t.stop());
        const blob = new Blob(this.chunks, { type: 'audio/webm' });
        this.objectUrl = URL.createObjectURL(blob);
        resolve(this.objectUrl);
      };
      this.mediaRecorder.stop();
    });
  }

  async startPlayer(uri: string): Promise<string> {
    const audio = new Audio(uri);
    await audio.play();
    return uri;
  }

  async stopPlayer(): Promise<void> {
    // no persistent player instance needed for current VoiceRecorder usage
  }
}
