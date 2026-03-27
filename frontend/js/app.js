// PROFESSIONAL VIDEO + AUDIO EDITOR v3.2 - 20+ HOLLYWOOD EFFECTS!

class VideoEditor {
  // TRIM
  updateClipTrim(type, value) {
    value = parseFloat(value);
    if (type === 'start') {
      this.state.clipEditing.trimStart = value;
    } else {
      this.state.clipEditing.trimEnd = value;
    }
  }

  applyTrim() {
    const clip = this.state.selectedClip;
    if (!clip) return;

    const { trimStart, trimEnd } = this.state.clipEditing;

    if (trimEnd > trimStart) {
      clip.startTime += trimStart;
      clip.duration = trimEnd - trimStart;
      this.renderTimeline();
      alert("Trim Applied!");
    } else {
      alert("Invalid trim values");
    }
  }

  // CROP
  updateCrop(prop, value) {
    this.state.clipEditing.crop[prop] = parseFloat(value);
  }

  applyCrop() {
    const crop = this.state.clipEditing.crop;
    const video = this.dom.previewVideo;

    if (!video) return;

    video.style.objectFit = 'cover';
    video.style.transform = `
    scale(${100 / crop.width})
    translate(-${crop.left}%, -${crop.top}%)
  `;

    alert("Crop Applied!");
  }

  // TEXT
  updateText(prop, value) {
    if (!this.state.clipEditing.textOverlay) {
      this.state.clipEditing.textOverlay = {
        text: '',
        x: 50,
        y: 20,
        fontSize: 32,
        color: '#ffffff',
        opacity: 1
      };
    }

    this.state.clipEditing.textOverlay[prop] = value;
  }

  applyTextOverlay() {
    const data = this.state.clipEditing.textOverlay;
    if (!data || !data.text) {
      alert("Enter text first!");
      return;
    }

    let overlay = document.querySelector('.video-overlay');

    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'video-overlay';
      document.querySelector('.preview-wrapper').appendChild(overlay);
    }

    overlay.innerText = data.text;
    overlay.style.left = data.x + '%';
    overlay.style.top = data.y + '%';
    overlay.style.fontSize = data.fontSize + 'px';
    overlay.style.color = data.color;
    overlay.style.opacity = data.opacity;

    alert("Text Applied!");
  }
  constructor() {
    this.state = {
      media: [],
      clips: [],
      selectedClip: null,
      currentTime: 0,
      projectName: 'Untitled Project',
      resolution: '1920x1080',
      fps: 30,
      zoomLevel: 1,
      effects: [
        'blur', 'brightness', 'contrast', 'grayscale', 'sepia', 'invert',
        'saturate', 'hue-rotate', 'drop-shadow', 'opacity',
        'emboss', 'sharpen', 'vintage', 'thermal', 'night-vision',
        'outline', 'pixelate', 'wave', 'glitch', 'film-grain'
      ]
    };

    // VIDEO CLIP EDITING STATE (Trim, Crop, Text)
    this.state.clipEditing = {
      trimStart: 0,
      trimEnd: 0,
      crop: { left: 0, top: 0, width: 100, height: 100 },
      textOverlay: null
    };

    this.isPlaying = false;
    this.audioContext = null;
    this.currentAudio = null;
    this.init();
  }

  init() {
    this.cacheDOM();
    this.bindEvents();
    this.addEffectsCSS();
    this.renderTimeline();
    this.renderEffects();
    this.renderProperties();
  }

  addEffectsCSS() {
    const style = document.createElement('style');
    style.textContent = `
      .effect-category { padding:8px 16px;background:rgba(99,102,241,0.2);color:white;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;border:2px solid transparent;transition:all 0.2s;margin-right:8px; }
      .effect-category.active, .effect-category:hover { background:rgba(99,102,241,0.6);border-color:#6366f1; }
      .effect-group:hover .effect-intensity { opacity:1 !important; }
      .effect-item.active { border-color:#10b981 !important; background:linear-gradient(135deg, rgba(16,185,129,0.3), rgba(16,185,129,0.1)) !important; }
      .timeline-clip.selected { border-color:#10b981 !important; box-shadow:0 0 0 2px rgba(16,185,129,0.5) !important; }
    `;
    document.head.appendChild(style);
  }

  cacheDOM() {
    this.dom = {
      mediaInput: document.getElementById('mediaInput'),
      mediaList: document.getElementById('mediaList'),
      videoPreview: document.getElementById('videoPreview'),
      previewVideo: document.getElementById('previewVideo'),
      previewCanvas: document.getElementById('previewCanvas'),
      timelineContainer: document.getElementById('timelineContainer'),
      playhead: document.getElementById('playhead'),
      timecode: document.getElementById('timecode'),
      playPauseBtn: document.getElementById('playPauseBtn'),
      stopBtn: document.getElementById('stopBtn'),
      newProjectBtn: document.getElementById('newProjectBtn'),
      saveProjectBtn: document.getElementById('saveProjectBtn'),
      exportBtn: document.getElementById('exportBtn'),
      zoomInBtn: document.getElementById('zoomInTimeline'),
      zoomOutBtn: document.getElementById('zoomOutTimeline'),
      projectNameInput: document.getElementById('projectNameInput'),
      propertiesContent: document.getElementById('propertiesContent'),
      effectsList: document.getElementById('effectsList'),
      audioTrackList: document.getElementById('audioTrackList')
    };
  }

  bindPropertyEvents() {
    // Trim events
    document.addEventListener('change', e => {
      if (e.target.closest('input[onchange*="updateClipTrim"]')) {
        this.renderProperties();
      }
    });
    }

  bindEvents() {
    document.getElementById('propertiesContent')
      .addEventListener('click', e => {
        if (e.target.closest('button[data-action="crop"]'))
          this.applyCrop();
        if (e.target.closest('button[data-action="text"]'))
          this.applyTextOverlay();
      });
    if (this.dom.mediaInput) {
      this.dom.mediaInput.addEventListener('change', (e) => this.handleMediaFiles(e));
    }

    if (this.dom.projectNameInput) {
      this.dom.projectNameInput.addEventListener('input', (e) => {
        this.state.projectName = e.target.value || "Untitled Project";
      });
    }

    if (this.dom.playPauseBtn) this.dom.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
    if (this.dom.stopBtn) this.dom.stopBtn.addEventListener('click', () => this.stopMedia());
    if (this.dom.newProjectBtn) this.dom.newProjectBtn.addEventListener('click', () => this.newProject());
    if (this.dom.saveProjectBtn) this.dom.saveProjectBtn.addEventListener('click', () => this.saveProject());
    if (this.dom.exportBtn) this.dom.exportBtn.addEventListener('click', () => this.exportProject());
    if (this.dom.zoomInBtn) this.dom.zoomInBtn.addEventListener('click', () => this.zoomTimeline(1.25));
    if (this.dom.zoomOutBtn) this.dom.zoomOutBtn.addEventListener('click', () => this.zoomTimeline(0.8));

    if (this.dom.timelineContainer) {
      this.dom.timelineContainer.addEventListener('dragover', e => e.preventDefault());
      this.dom.timelineContainer.addEventListener('drop', e => this.handleDrop(e));
      this.dom.timelineContainer.addEventListener('click', e => this.selectClip(e));
    }

    if (this.dom.previewVideo) {
      this.dom.previewVideo.addEventListener('timeupdate', () => this.updateTimecode());
      this.dom.previewVideo.addEventListener('loadedmetadata', () => this.updateTimecode());
      this.dom.previewVideo.addEventListener('ended', () => this.mediaEnded());
    }

    document.querySelectorAll('.panel-tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchPanel(e.target.dataset.panel));
    });

    // ENHANCED EFFECTS + INTENSITY HANDLER
    document.addEventListener('click', (e) => {
      if (e.target.closest('.effect-item')) {
        const effect = e.target.closest('.effect-item').dataset.effect;
        this.applyEffect(effect);
      }
      if (e.target.closest('.effect-category')) {
        const category = e.target.closest('.effect-category').dataset.category;
        this.filterEffects(category);
      }
    });

    // EFFECT INTENSITY SLIDER
    document.addEventListener('input', (e) => {
      if (e.target.classList.contains('effect-intensity')) {
        const effectName = e.target.closest('.effect-group').dataset.effect;
        const intensity = parseFloat(e.target.value);
        this.updateEffectIntensity(effectName, intensity);
      }
    });
  }

  // HOLLYWOOD EFFECTS ENGINE - 20+ Pro Filters!
  getFilterValue(effectName, intensity = 1.0) {
    const values = {
      'blur': `blur(${5 * intensity}px)`,
      'brightness': `brightness(${1 + 0.5 * intensity})`,
      'contrast': `contrast(${1 + 0.5 * intensity})`,
      'grayscale': `grayscale(${100 * intensity}%)`,
      'sepia': `sepia(${80 * intensity}%)`,
      'invert': `invert(${100 * intensity}%)`,
      'saturate': `saturate(${2 * intensity})`,
      'opacity': `opacity(${1 - 0.3 * intensity})`,
      'hue-rotate': `hue-rotate(${intensity * 180}deg)`,
      'drop-shadow': `drop-shadow(2px 2px 4px rgba(0,0,0,${0.5 * intensity}))`,
      'emboss': `brightness(${1 + 0.2 * intensity}) contrast(${1.3 * intensity}) grayscale(20%)`,
      'sharpen': `contrast(${1.2 * intensity}) brightness(${1.1 * intensity})`,
      'vintage': `sepia(60%) brightness(0.9) contrast(1.1) saturate(1.2) hue-rotate(10deg)`,
      'thermal': `grayscale(100%) contrast(${1.5 * intensity}) brightness(${1.2 * intensity}) hue-rotate(20deg)`,
      'night-vision': `grayscale(100%) contrast(1.5) brightness(0.3) hue-rotate(120deg) sepia(20%)`,
      'outline': `drop-shadow(0 0 0 ${2 * intensity}px #f59e0b) drop-shadow(0 0 0 ${3 * intensity}px #ef4444)`,
      'pixelate': `contrast(${2 * intensity}) brightness(1.1)`,
      'wave': `hue-rotate(${intensity * 45}deg) contrast(1.2)`,
      'glitch': `hue-rotate(${intensity * 90}deg) contrast(1.5) brightness(1.2)`,
      'film-grain': `contrast(1.1) brightness(1.05)`
    };
    return values[effectName] || '';
  }

  getEffectIcon(effect) {
    const icons = {
      'blur': '', 'brightness': '', 'contrast': '', 'grayscale': '',
      'sepia': '', 'invert': '', 'saturate': '', 'hue-rotate': '',
      'drop-shadow': '', 'opacity': '', 'emboss': '', 'sharpen': '',
      'vintage': '', 'thermal': '', 'night-vision': '', 'outline': '',
      'pixelate': '', 'wave': '', 'glitch': '', 'film-grain': ''
    };
    return icons[effect] || '';
  }

  previewMedia(item) {
    this.stopMedia();
    const clip = this.state.selectedClip;

    if (item.type === 'video') {
      this.dom.previewVideo.style.display = 'block';
      if (this.dom.previewCanvas) this.dom.previewCanvas.style.display = 'none';
      this.dom.previewVideo.src = item.url;
      this.dom.previewVideo.load();
      this.dom.playPauseBtn.textContent = 'PLAY';

      // Auto-set trimEnd = full duration when video is selected
      if (clip && clip.type === 'video' && item.duration) {
        this.state.clipEditing.trimStart = 0;
        this.state.clipEditing.trimEnd = item.duration;
      }

      setTimeout(() => this.updatePreviewFilters(), 100);
    } else if (item.type === 'audio') {
      this.dom.previewVideo.style.display = 'none';
      if (this.dom.previewCanvas) {
        this.dom.previewCanvas.style.display = 'block';
        this.createAudioWaveform(item);
      }
      this.dom.playPauseBtn.textContent = 'PLAY';
    }
  }

  createAudioWaveform(item) {
    if (!this.dom.previewCanvas) return;
    const canvas = this.dom.previewCanvas;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const audio = new Audio(item.url);
    audio.loop = true;

    if (window.AudioContext) {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;

      const source = audioCtx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioCtx.destination);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      function animate() {
        analyser.getByteFrequencyData(dataArray);
        ctx.fillStyle = 'rgba(15,23,42,0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = dataArray[i] / 2;
          const hue = i / bufferLength * 360;

          ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
          ctx.shadowColor = `hsl(${hue}, 70%, 50%)`;
          ctx.shadowBlur = 10;

          ctx.fillRect(x, canvas.height / 2 - barHeight / 2, barWidth, barHeight);
          x += barWidth + 1;
        }
        ctx.shadowBlur = 0;
        requestAnimationFrame(animate);
      }

      audio.play().then(() => animate()).catch(() => { });
      this.currentAudio = audio;
    }
  }

  stopMedia() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if (this.dom.previewVideo) {
      this.dom.previewVideo.pause();
      this.dom.previewVideo.currentTime = 0;
      this.dom.previewVideo.src = '';
      this.dom.previewVideo.style.filter = 'none';
    }
    this.dom.playPauseBtn.textContent = 'PLAY';
    this.dom.timecode.textContent = '00:00 / 00:00';
    if (this.dom.playhead) this.dom.playhead.style.left = '0px';
  }

  // PRO EFFECTS ENGINE
  applyEffect(effectName) {
    if (!this.state.selectedClip) {
      alert('Select a clip first');
      return;
    }

    if (!this.state.selectedClip.effects) this.state.selectedClip.effects = [];

    const existingEffect = this.state.selectedClip.effects.find(e => e.name === effectName);
    if (existingEffect) {
      existingEffect.active = !existingEffect.active;
    } else {
      const effect = { name: effectName, active: true, intensity: 1.0 };
      this.state.selectedClip.effects.push(effect);
    }

    this.updatePreviewFilters();
    this.renderTimeline();
    this.renderProperties();
    this.renderEffects();
  }
              
  updateEffectIntensity(effectName, intensity) {
    if (!this.state.selectedClip) return;
    const effect = this.state.selectedClip.effects.find(e => e.name === effectName);
    if (effect) {
      effect.intensity = parseFloat(intensity);
      this.updatePreviewFilters();
      this.renderProperties();
    }
  }

  updatePreviewFilters() {
    if (!this.state.selectedClip || !this.dom.previewVideo || this.state.selectedClip.type !== 'video') return;

    const activeEffects = (this.state.selectedClip.effects || [])
      .filter(e => e.active)
      .map(effect => this.getFilterValue(effect.name, effect.intensity))
      .filter(Boolean);

    const filters = activeEffects.join(' ') || 'none';
    this.dom.previewVideo.style.filter = filters;
  }

  handleMediaFiles(e) {
    Array.from(e.target.files).forEach(file => {
      const mediaItem = {
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type.startsWith('video/') ? 'video' :
          file.type.startsWith('audio/') ? 'audio' : 'image',
        duration: 5,
        file: file
      };
      this.state.media.push(mediaItem);
      this.renderMediaItem(mediaItem);
    });
    e.target.value = '';
  }

  renderMediaItem(item) {
    const div = document.createElement('div');
    div.className = 'media-item';
    div.draggable = true;
    div.dataset.mediaId = item.id;
    div.style.cssText = 'display:flex;gap:12px;padding:12px;background:rgba(15,23,42,0.8);border-radius:12px;margin-bottom:8px;border:1px solid rgba(99,102,241,0.3);cursor:grab;';

    const typeLabel = item.type.toUpperCase();
    div.innerHTML = `
      <div style="width:60px;height:40px;background:linear-gradient(135deg,${item.type === 'audio' ? '#10b981' : '#6366f1'},${item.type === 'audio' ? '#059669' : '#4f46e5'});border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-size:20px;">
        ${typeLabel.charAt(0)}
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:500;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${item.name}">${item.name}</div>
        <div style="font-size:11px;color:#9ca3af;">${typeLabel}</div>
      </div>
    `;

    div.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', JSON.stringify(item));
    });

    div.addEventListener('click', (e) => {
      e.stopPropagation();
      this.previewMedia(item);
    });

    this.dom.mediaList.appendChild(div);
  }

  handleDrop(e) {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const rect = this.dom.timelineContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const time = x / (40 * this.state.zoomLevel);

      const clip = {
        id: Date.now(),
        mediaId: data.id,
        type: data.type,
        startTime: Math.max(0, time),
        duration: data.duration || 5,
        volume: 1.0,
        effects: []
      };

      this.state.clips.push(clip);
      this.renderTimeline();
    } catch (err) {
      console.error('Drop error:', err);
    }
  }

  renderTimeline() {
    document.querySelectorAll('.track-content').forEach(content => content.innerHTML = '');
    this.state.clips.forEach(clip => {
      const media = this.state.media.find(m => m.id === clip.mediaId);
      if (!media) return;
      const trackContent = document.querySelector(`[data-track-type="${clip.type}"] .track-content`);
      if (!trackContent) return;

      const clipEl = document.createElement('div');
      clipEl.className = `timeline-clip ${clip.effects?.length ? 'has-effects' : ''}`;
      clipEl.dataset.clipId = clip.id;
      clipEl.style.cssText = `
        position:absolute;left:${clip.startTime * 40 * this.state.zoomLevel}px;
        width:${clip.duration * 40 * this.state.zoomLevel}px;height:40px;margin:5px;
        background:linear-gradient(135deg,${clip.type === 'audio' ? '#10b981' : '#3b82f6'},${clip.type === 'audio' ? '#059669' : '#1d4ed8'});
        border-radius:6px;cursor:move;color:white;display:flex;align-items:center;padding:0 8px;font-size:11px;font-weight:500;
        box-shadow:0 2px 8px rgba(0,0,0,0.2);${clip.effects?.filter(e => e.active).length ? 'border:2px solid #f59e0b;' : ''}
      `;
      const effectsCount = clip.effects?.filter(e => e.active).length || 0;
      clipEl.innerHTML = `<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${media.name.slice(0, 12)}${media.name.length > 12 ? '...' : ''}${effectsCount > 0 ? ` [FX:${effectsCount}]` : ''}</span>`;
      trackContent.appendChild(clipEl);
    });
  }

  selectClip(e) {
    const clipEl = e.target.closest('.timeline-clip');
    if (clipEl) {
      document.querySelectorAll('.timeline-clip').forEach(c => c.classList.remove('selected'));
      clipEl.classList.add('selected');
      this.state.selectedClip = this.state.clips.find(c => c.id == clipEl.dataset.clipId);
      this.renderProperties();
      this.renderEffects();

      const media = this.state.media.find(m => m.id === this.state.selectedClip.mediaId);
      if (media) this.previewMedia(media);
    }
  }

  // PRO EFFECTS PANEL
  renderEffects() {
    if (!this.dom.effectsList) return;
    this.dom.effectsList.innerHTML = `
      <div style="padding:24px;">
        <div style="display:flex;gap:12px;margin-bottom:20px;overflow-x:auto;padding-bottom:8px;">
          <div class="effect-category active" data-category="all">All (${this.state.effects.length})</div>
          <div class="effect-category" data-category="basic">Basic</div>
          <div class="effect-category" data-category="color">Color</div>
          <div class="effect-category" data-category="advanced">Advanced</div>
          <div class="effect-category" data-category="glitch">Glitch</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:16px;">
          ${this.state.effects.map(effect => `
            <div class="effect-group" data-effect="${effect}">
              <div class="effect-item ${this.isEffectApplied(effect) ? 'active' : ''}" data-effect="${effect}" style="
                padding:20px;background:linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.1));
                border:2px solid rgba(99,102,241,${this.isEffectApplied(effect) ? '0.6' : '0.3'});border-radius:12px;
                cursor:pointer;transition:all 0.3s;position:relative;overflow:hidden;
              ">
                <div style="font-size:28px;margin-bottom:12px;">FX</div>
                <div style="font-size:13px;font-weight:600;color:white;text-align:center;">${effect.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                ${this.isEffectApplied(effect) ? '<div style="position:absolute;top:4px;right:4px;background:#10b981;color:white;padding:2px 6px;border-radius:10px;font-size:10px;font-weight:600;">ON</div>' : ''}
              </div>
              <div style="margin-top:8px;opacity:${this.isEffectApplied(effect) ? '1' : '0'};transition:opacity 0.2s;">
                <input type="range" class="effect-intensity" min="0" max="2" step="0.1" value="${this.getEffectIntensity(effect)}" style="
                  width:100%;height:4px;background:linear-gradient(90deg, #6366f1, #10b981);border-radius:2px;outline:none;
                ">
                <div style="font-size:11px;color:#9ca3af;text-align:center;margin-top:4px;">Intensity: ${this.getEffectIntensity(effect) * 100}%</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  isEffectApplied(effectName) {
    return this.state.selectedClip?.effects?.some(e => e.name === effectName && e.active) || false;
  }

  getEffectIntensity(effectName) {
    return this.state.selectedClip?.effects?.find(e => e.name === effectName)?.intensity || 1.0;
  }

  filterEffects(category, e) {
    document.querySelectorAll('.effect-category').forEach(c => c.classList.remove('active'));
    if (e) e.target.classList.add('active');

    const effectGroups = document.querySelectorAll('.effect-group');
    const categories = {
      basic: ['blur', 'brightness', 'contrast', 'grayscale'],
      color: ['sepia', 'invert', 'saturate', 'hue-rotate'],
      advanced: ['drop-shadow', 'emboss', 'sharpen', 'vintage', 'thermal', 'night-vision'],
      glitch: ['outline', 'pixelate', 'wave', 'glitch', 'film-grain']
    };

    effectGroups.forEach(group => {
      const effect = group.dataset.effect;
      const show = category === 'all' || (categories[category]?.includes(effect));
      group.style.display = show ? 'block' : 'none';
    });
  }

  renderProperties() {
    if (!this.state.selectedClip) {
      this.dom.propertiesContent.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:40px;">Click a clip to edit properties</p>';
      return;
    }
    const clip = this.state.selectedClip;
    const media = this.state.media.find(m => m.id === clip.mediaId);
    const activeEffectsCount = clip.effects?.filter(e => e.active).length || 0;

    let innerHTML = `
    <div style="text-align:center;margin-bottom:24px;background:rgba(99,102,241,0.1);padding:20px;border-radius:12px;">
      <h3 style="color:#6366f1;margin:0 0 8px 0;font-size:18px;">${media ? media.name : 'Clip'}</h3>
      <div style="color:#9ca3af;font-size:12px;">${clip.type?.toUpperCase()} - ${activeEffectsCount} Active Effects</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:16px;">
      <label>Start Time (s): 
        <input type="number" step="0.1" min="0" value="${clip.startTime.toFixed(1)}" 
          style="width:100%;padding:10px;border:1px solid #6366f1;border-radius:6px;background:rgba(15,23,42,0.8);color:white;"
          onchange="editor.updateClipProperty('${clip.id}', 'startTime', this.value)">
      </label>
      <label>Duration (s): 
        <input type="number" step="0.1" min="0.1" max="60" value="${clip.duration}" 
          style="width:100%;padding:10px;border:1px solid #6366f1;border-radius:6px;background:rgba(15,23,42,0.8);color:white;"
          onchange="editor.updateClipProperty('${clip.id}', 'duration', this.value)">
      </label>
      <label>Volume: 
       <input type="range" min="0" max="2" step="0.1" value="${clip.volume}" 
  style="width:100%;" onchange="editor.updateClipProperty('${clip.id}', 'volume', this.value)">
        <span>${(clip.volume * 100).toFixed(0)}%</span>
      </label>
      ${clip.effects?.length ? `
        <div style="padding:16px;background:rgba(16,185,129,0.2);border:1px solid rgba(16,185,129,0.4);border-radius:12px;">
          <div style="font-size:14px;color:#10b981;font-weight:600;margin-bottom:12px;">Active Effects (${activeEffectsCount})</div>
          ${clip.effects.map((effect, i) => `
            <div style="display:flex;justify-content:space-between;align-items:center;
                        padding:12px;background:rgba(255,255,255,0.08);border-radius:8px;margin-bottom:8px;
                        border-left:4px solid ${effect.active ? '#10b981' : '#6b7280'};">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-weight:500;">${effect.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                ${effect.active ? '<span style="background:#10b981;color:white;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:600;">ACTIVE</span>' : ''}
              </div>
              <div style="display:flex;align-items:center;gap:8px;">
                <input type="range" min="0" max="2" step="0.1" value="${effect.intensity}" 
                  style="width:80px;height:6px;" onchange="editor.updateEffectIntensity('${effect.name}', this.value)">
                <span style="font-size:11px;color:#9ca3af;min-width:35px;text-align:right;">${(effect.intensity * 100).toFixed(0)}%</span>
                <button onclick="editor.removeEffect('${clip.id}', ${i});editor.renderEffects();" style="
                  padding:4px 12px;background:rgba(239,68,68,0.3);color:#ef4444;border:none;border-radius:6px;font-size:11px;cursor:pointer;font-weight:500;">
                  Remove
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;

    // VIDEO CLIP Trim, Crop, Text UI
    if (clip.type === 'video') {
      const editing = this.state.clipEditing;
      innerHTML += `
      <div class="clip-editing" style="margin-top:24px;padding:20px;background:rgba(15,23,42,0.9);border-radius:12px;border:1px solid rgba(99,102,241,0.4);">
        <h4 style="color:#f59e0b;margin:0 0 16px 0;font-size:14px;">Trim and Crop</h4>

        <div style="display:flex;gap:12px;margin-bottom:12px;">
          <label style="flex:1;">
            Trim Start (s):
            <input type="number" step="0.1" min="0" max="${clip.duration}" style="width:100%;padding:10px;border:1px solid #6366f1;border-radius:6px;background:rgba(15,23,42,0.8);color:white;"
                   value="${editing.trimStart}" onchange="editor.updateClipTrim('start', this.value)">
          </label>
          <label style="flex:1;">
            Trim End (s):
            <input type="number" step="0.1" min="0.1" max="${clip.duration}" style="width:100%;padding:10px;border:1px solid #6366f1;border-radius:6px;background:rgba(15,23,42,0.8);color:white;"
                   value="${editing.trimEnd}" onchange="editor.updateClipTrim('end', this.value)">
          </label>
        </div>

        <button onclick="editor.applyTrim()" style="margin-bottom:12px;padding:8px 16px;background:#10b981;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">
          Apply Trim
        </button>

        <div style="margin-bottom:16px;">
          <h5 style="color:#fbbf24;font-size:12px;margin:0 0 8px 0;">Crop Area (percent)</h5>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <div><label>X: <input type="number" min="0" max="100" value="${editing.crop.left}" style="width:100%;padding:4px;background:rgba(15,23,42,0.8);color:white;border:1px solid #6366f1;" onchange="editor.updateCrop('left',this.value)"></label></div>
            <div><label>Y: <input type="number" min="0" max="100" value="${editing.crop.top}" style="width:100%;padding:4px;background:rgba(15,23,42,0.8);color:white;border:1px solid #6366f1;" onchange="editor.updateCrop('top',this.value)"></label></div>
            <div><label>W: <input type="number" min="0" max="100" value="${editing.crop.width}" style="width:100%;padding:4px;background:rgba(15,23,42,0.8);color:white;border:1px solid #6366f1;" onchange="editor.updateCrop('width',this.value)"></label></div>
            <div><label>H: <input type="number" min="0" max="100" value="${editing.crop.height}" style="width:100%;padding:4px;background:rgba(15,23,42,0.8);color:white;border:1px solid #6366f1;" onchange="editor.updateCrop('height',this.value)"></label></div>
          </div>
          <button onclick="editor.applyCrop()" style="
            margin-top:8px;padding:8px 16px;background:#6366f1;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">
            Apply Crop
          </button>
        </div>

        <div>
          <h5 style="color:#a78bfa;font-size:12px;margin:0 0 8px 0;">Text Overlay</h5>
          <input type="text" placeholder="Overlay text here..." style="width:100%;padding:8px;background:rgba(15,23,42,0.8);color:white;border-radius:6px;margin-bottom:8px;"
                 value="${editing.textOverlay?.text ?? ''}" onchange="editor.updateText('text', this.value)">

          <div style="display:flex;gap:8px;margin-bottom:8px;">
            <label>Font size:
              <input type="number" min="10" max="100" value="${editing.textOverlay?.fontSize ?? 32}" style="width:80px;padding:4px;background:rgba(15,23,42,0.8);color:white;border-radius:4px;"
                     onchange="editor.updateText('fontSize', this.value)">
              px
            </label>
            <label>Opacity:
              <input type="number" min="0" max="1" step="0.1" value="${editing.textOverlay?.opacity ?? 1}" style="width:80px;padding:4px;background:rgba(15,23,42,0.8);color:white;border-radius:4px;"
                     onchange="editor.updateText('opacity', this.value)">
            </label>
          </div>

          <div style="display:flex;gap:8px;margin-bottom:16px;">
            <label>Color:
              <input type="color" value="${editing.textOverlay?.color ?? '#ffffff'}" style="height:30px;" onchange="editor.updateText('color', this.value)">
            </label>
            <label>Left:
              <input type="number" min="0" max="100" value="${editing.textOverlay?.x ?? 50}" style="width:60px;padding:4px;background:rgba(15,23,42,0.8);color:white;border-radius:4px;"
                     onchange="editor.updateText('x', this.value)">
              %
            </label>
            <label>Top:
              <input type="number" min="0" max="100" value="${editing.textOverlay?.y ?? 20}" style="width:60px;padding:4px;background:rgba(15,23,42,0.8);color:white;border-radius:4px;"
                     onchange="editor.updateText('y', this.value)">
              %
            </label>
          </div>

          <button onclick="editor.applyTextOverlay()" style="
            padding:8px 16px;background:#8b5cf6;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">
            Apply Text
          </button>
        </div>
      </div>
    `;
    }

    this.dom.propertiesContent.innerHTML = innerHTML;
  }



  removeEffect(clipId, effectIndex) {
    const clip = this.state.clips.find(c => c.id === clipId);
    if (clip && clip.effects) {
      clip.effects.splice(effectIndex, 1);
      this.renderProperties();
      this.renderTimeline();
      this.renderEffects();
      this.updatePreviewFilters();
    }
  }

  updateClipProperty(clipId, property, value) {
    const clip = this.state.clips.find(c => c.id === clipId);
    if (clip) {
      clip[property] = parseFloat(value);
      this.renderTimeline();
      this.renderProperties();
    }
  }

  switchPanel(panelId) {
    document.querySelectorAll('.panel-content').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(panelId)?.classList.add('active');
    event?.target?.classList.remove('active');
  }

  zoomTimeline(factor) {
    this.state.zoomLevel *= factor;
    this.state.zoomLevel = Math.max(0.2, Math.min(8, this.state.zoomLevel));
    this.renderTimeline();
  }

  updateTimecode() {
    const current = this.dom.previewVideo?.currentTime || 0;
    const duration = this.dom.previewVideo?.duration || 0;
    if (this.dom.timecode) {
      this.dom.timecode.textContent = `${this.formatTime(current)} / ${this.formatTime(duration)}`;
    }
    const pxPerSecond = 40 * this.state.zoomLevel;
    if (this.dom.playhead) {
      this.dom.playhead.style.left = `${current * pxPerSecond}px`;
    }
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  togglePlayPause() {
    if (this.currentAudio) {
      if (this.currentAudio.paused) {
        this.currentAudio.play();
        this.dom.playPauseBtn.textContent = 'PAUSE';
      } else {
        this.currentAudio.pause();
        this.dom.playPauseBtn.textContent = 'PLAY';
      }
    } else if (this.dom.previewVideo?.paused) {
      this.dom.playPauseBtn.textContent = 'PAUSE';
      this.dom.previewVideo.play().catch(() => { });
    } else {
      this.dom.playPauseBtn.textContent = 'PLAY';
      this.dom.previewVideo.pause();
    }
  }

  mediaEnded() {
    this.dom.playPauseBtn.textContent = 'PLAY';
  }

  newProject() {
    if (confirm('Create new project? All unsaved changes will be lost.')) {
      this.state = { media: [], clips: [], zoomLevel: 1, projectName: 'New Project', effects: this.state.effects };
      this.dom.mediaList.innerHTML = '';
      this.renderTimeline();
      this.renderProperties();
      this.stopMedia();
      this.renderEffects();
    }
  }

  async saveProject() {
    if (this.dom.projectNameInput) this.state.projectName = this.dom.projectNameInput.value;

    const cleanState = JSON.parse(JSON.stringify(this.state));
    cleanState.media = cleanState.media.map(m => {
      const cleanMedia = { ...m };
      delete cleanMedia.url;
      delete cleanMedia.file;
      return cleanMedia;
    });

    localStorage.setItem('videoEditorProject', JSON.stringify(cleanState));

    try {
// app.js mein line 837 ke paas:
const backendURL = 'https://cinema-backend.onrender.com/api/projects';      await fetch(backendURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanState)
      });
      // console.log('BACKEND SAVE SUCCESS!');
    } catch (e) {
      // console.log('Backend error');
    }

    alert('Project Saved!');
    // console.log(`${cleanState.clips.length} clips saved`);
  }

  // 🎬 UPDATED EXPORT ENGINE - Captures Canvas Stream + Audio
  async exportProject() {
    if (this.state.clips.length === 0) {
      alert('Add clips to the timeline first!');
      return;
    }

    const video = this.dom.previewVideo;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set export resolution
    canvas.width = 1920; 
    canvas.height = 1080;

    const stream = canvas.captureStream(this.state.fps);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
    const chunks = [];

    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.state.projectName}.webm`;
      a.click();
      alert("✅ Export Complete!");
    };

    // Start Recording
    recorder.start();
    video.currentTime = 0;
    video.play();

    const renderFrame = () => {
      if (video.paused || video.ended) {
        recorder.stop();
        return;
      }

      // 1. Apply Filters to Canvas
      ctx.filter = getComputedStyle(video).filter;
      
      // 2. Draw Video Frame (Handles Crop via drawImage)
      const crop = this.state.clipEditing.crop;
      const sX = (crop.left / 100) * video.videoWidth;
      const sY = (crop.top / 100) * video.videoHeight;
      const sW = (crop.width / 100) * video.videoWidth;
      const sH = (crop.height / 100) * video.videoHeight;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, sX, sY, sW, sH, 0, 0, canvas.width, canvas.height);

      // 3. Apply Text Overlays
      const textData = this.state.clipEditing.textOverlay;
      if (textData && textData.text) {
        ctx.filter = 'none'; // Don't blur the text if the video is blurred
        ctx.fillStyle = textData.color;
        ctx.font = `${(textData.fontSize / 100) * canvas.height}px Arial`;
        ctx.globalAlpha = textData.opacity;
        ctx.fillText(
          textData.text, 
          (textData.x / 100) * canvas.width, 
          (textData.y / 100) * canvas.height
        );
        ctx.globalAlpha = 1.0;
      }

      requestAnimationFrame(renderFrame);
    };

    renderFrame();
    // console.log("Recording started...");
  }}  
document.addEventListener('DOMContentLoaded', () => {
  window.editor = new VideoEditor();

  // console.log('VIDEO EDITOR v3.2 - 20+ HOLLYWOOD EFFECTS!');
  // console.log('SAVE = Save Project | EXPORT = Export Summary');
  // console.log('Effects: Click to Toggle ON/OFF | Slider to Intensity Control');
  // console.log('Console: editor.state, editor.saveProject(), editor.exportProject()');
})