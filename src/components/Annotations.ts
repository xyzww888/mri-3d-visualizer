import * as THREE from 'three';
import { ANNOTATIONS_DATA, AnnotationItem } from '../config/constants';
import { Viewer } from '../core/Viewer';

export class Annotations {
  private viewer: Viewer;
  private container: HTMLElement;
  private markers: { element: HTMLElement; data: AnnotationItem }[] = [];
  private infoModal: HTMLElement;
  private infoTag: HTMLElement;
  private infoTitle: HTMLElement;
  private infoDesc: HTMLElement;
  private infoSpecs: HTMLElement;
  private isVisible = false;
  private onSelectCallback?: (item: AnnotationItem) => void;

  constructor(viewer: Viewer, onSelect?: (item: AnnotationItem) => void, initialItems: AnnotationItem[] = ANNOTATIONS_DATA) {
    this.viewer = viewer;
    this.onSelectCallback = onSelect;

    const cont = document.getElementById('annotations-container');
    const modal = document.getElementById('info-modal');
    const tag = document.getElementById('info-tag');
    const title = document.getElementById('info-title');
    const desc = document.getElementById('info-desc');
    const specs = document.getElementById('info-specs');
    const closeBtn = document.getElementById('btn-close-modal');

    if (!cont || !modal || !tag || !title || !desc || !specs) {
      throw new Error('Annotations DOM elements missing.');
    }

    this.container = cont;
    this.infoModal = modal;
    this.infoTag = tag;
    this.infoTitle = title;
    this.infoDesc = desc;
    this.infoSpecs = specs;

    this.container.style.display = 'none';

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideModal());
    }

    this.setItems(initialItems);
    this.viewer.registerUpdate(() => this.updatePositions());
  }

  public setItems(items: AnnotationItem[]) {
    this.container.innerHTML = '';
    this.markers = [];
    this.hideModal();

    items.forEach((item) => {
      const el = document.createElement('div');
      el.className = 'annotation-marker';
      el.innerHTML = `
        <div class="marker-pin">${item.index}</div>
        <div class="marker-label">${item.shortLabel}</div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectAnnotation(item);
      });

      this.container.appendChild(el);
      this.markers.push({ element: el, data: item });
    });
  }

  public selectAnnotation(item: AnnotationItem) {
    if (this.onSelectCallback) {
      this.onSelectCallback(item);
    }

    this.viewer.animateCameraTo(item.targetView.position, item.targetView.target, 1.15);

    this.infoTag.textContent = item.category;
    this.infoTitle.textContent = item.name;
    this.infoDesc.textContent = item.description;

    let specsHtml = '';
    for (const [k, v] of Object.entries(item.specs)) {
      specsHtml += `
        <div class="spec-item">
          <span class="spec-name">${k}</span>
          <span class="spec-value">${v}</span>
        </div>
      `;
    }
    this.infoSpecs.innerHTML = specsHtml;
    this.infoModal.classList.remove('hidden');
  }

  public hideModal() {
    this.infoModal.classList.add('hidden');
  }

  public toggleVisibility(): boolean {
    this.isVisible = !this.isVisible;
    this.container.style.display = this.isVisible ? 'block' : 'none';
    if (!this.isVisible) this.hideModal();
    return this.isVisible;
  }

  private updatePositions() {
    if (!this.isVisible) return;

    const camera = this.viewer.camera;
    const widthHalf = window.innerWidth / 2;
    const heightHalf = window.innerHeight / 2;
    const tempV = new THREE.Vector3();

    this.markers.forEach(({ element, data }) => {
      tempV.copy(data.position);
      tempV.project(camera);

      if (tempV.z > 1) {
        element.style.opacity = '0';
        element.style.pointerEvents = 'none';
        return;
      }

      element.style.opacity = '1';
      element.style.pointerEvents = 'auto';

      const x = tempV.x * widthHalf + widthHalf;
      const y = -(tempV.y * heightHalf) + heightHalf;

      element.style.left = `${x}px`;
      element.style.top = `${y}px`;
    });
  }
}
