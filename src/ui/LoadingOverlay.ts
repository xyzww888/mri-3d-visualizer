export class LoadingOverlay {
  private overlay: HTMLElement;
  private progressBar: HTMLElement;
  private text: HTMLElement;

  constructor() {
    this.overlay = document.getElementById('loading-overlay') as HTMLElement;
    this.progressBar = document.getElementById('progress-bar') as HTMLElement;
    this.text = document.getElementById('loading-text') as HTMLElement;
  }

  public update(percent: number, message?: string) {
    if (this.progressBar) {
      this.progressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
    }
    if (message && this.text) {
      this.text.textContent = message;
    }
  }

  public hide() {
    if (!this.overlay) return;
    this.overlay.classList.add('fade-out');
    setTimeout(() => {
      this.overlay.style.display = 'none';
    }, 600);
  }
}
