       class VideoCard extends HTMLElement {
            connectedCallback() {
            this.renderThumb();
            }

            renderThumb() {
                const src = this.getAttribute('src');
                const title = this.getAttribute('title');
                const poster = this.getAttribute('poster');
                const overlay = this.getAttribute('overlay') || "PREVIEW"; // 获取文字属性

                this.innerHTML = `
                    <figure class="video-card">
                        <div class="thumb" role="button">
                            <img src="${poster}" alt="${title}">
                            <p class="overlay-text">
                                <i class="icon-video"></i>
                                ${overlay}
                            </p>                            
                            <span class="play-button"></span>
                        </div>
                        <figcaption></figcaption>
                    </figure>
                `;

                this.querySelector('.thumb').addEventListener('click', () => {
                    this.loadVideo(src, poster, title);
                });
            }

            loadVideo(src, poster, title) {
            // 1. 给组件添加播放状态类
            this.classList.add('is-playing');

            this.innerHTML = `
                <figure class="video-card">
                    <div class="player">
                        <video controls autoplay playsinline poster="${poster}">
                            <source src="${src}" type="video/mp4">
                        </video>
                        <p class="overlay-text">
                            <i class="icon-video"></i>
                            ${this.getAttribute('overlay') || "PREVIEW"}
                        </p>
                    </div>

                    <figcaption></figcaption>
                </figure>
            `;

            const videoElem = this.querySelector('video');
            videoElem.addEventListener('ended', () => {
                this.classList.remove('is-playing'); // 播放结束移除类                
                this.renderThumb(); // 播放结束，切回封面状态
            });           
            }
        }

        customElements.define('video-card', VideoCard);