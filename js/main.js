class QuizApp {
    constructor() {
        this.currentSet = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.userAnswers = [];
        this.currentSetId = '';
        this.currentPartIndex = 0;

        this.views = {
            home: document.getElementById('home-view'),
            quiz: document.getElementById('quiz-view'),
            results: document.getElementById('results-view'),
            study: document.getElementById('study-view'),
            video: document.getElementById('video-view'),
            subSelection: document.getElementById('sub-selection-view')
        };

        this.elements = {
            questionText: document.getElementById('question-text'),
            optionsGrid: document.getElementById('options-grid'),
            currentQ: document.getElementById('current-q'),
            totalQ: document.getElementById('total-q'),
            scoreTracker: document.getElementById('score-tracker'),
            progressBar: document.getElementById('progress-bar'),
            explanationBox: document.getElementById('explanation-box'),
            explanationText: document.getElementById('explanation-text'),
            prevBtn: document.getElementById('prev-btn'),
            imageContainer: document.getElementById('image-container'),
            questionImage: document.getElementById('question-image'),
            finalPercent: document.getElementById('final-percent'),
            totalCorrect: document.getElementById('total-correct'),
            totalWrong: document.getElementById('total-wrong'),
            reviewContainer: document.getElementById('review-container'),
            reviewList: document.getElementById('review-list'),
            videoGrid: document.getElementById('video-grid'),
            partsGrid: document.getElementById('parts-grid'),
            subTitle: document.getElementById('sub-category-title')
        };

        this.init();
    }

    init() {
        this.initTheme();

        // Event Listeners
        document.querySelectorAll('.set-card').forEach(card => {
            card.addEventListener('click', () => this.showSubSections(card.dataset.set));
        });

        if (this.elements.prevBtn) this.elements.prevBtn.addEventListener('click', () => this.prevQuestion());

        document.getElementById('home-btn-quiz').addEventListener('click', () => this.showView('home'));
        document.getElementById('home-btn-results').addEventListener('click', () => this.showView('home'));
        document.getElementById('back-to-home').addEventListener('click', () => this.showView('home'));
        document.getElementById('retry-btn').addEventListener('click', () => this.startQuiz(this.currentSetId, this.currentPartIndex));

        const studyBtn = document.getElementById('study-btn');
        if (studyBtn) studyBtn.addEventListener('click', () => this.showView('study'));

        const videoBtn = document.getElementById('video-btn');
        if (videoBtn) videoBtn.addEventListener('click', () => {
            this.renderVideoGrid();
            this.showView('video');
        });

        const backHomeVideo = document.getElementById('back-home-video');
        if (backHomeVideo) {
            backHomeVideo.addEventListener('click', () => {
                const iframe = document.querySelector('.video-container-wrapper iframe');
                if (iframe) iframe.src = ''; // Stop playback
                this.showView('home');
            });
        }

        const backHomeStudy = document.getElementById('back-home-study');
        if (backHomeStudy) backHomeStudy.addEventListener('click', () => this.showView('home'));

        // Image Modal Logic
        const modal = document.getElementById('image-modal');
        const modalImg = document.getElementById('modal-img');
        const closeBtn = document.querySelector('.modal-close');

        if (modal && modalImg && closeBtn) {
            document.querySelectorAll('.study-item img').forEach(img => {
                img.onclick = () => {
                    modal.classList.add('active');
                    modalImg.src = img.src;
                };
            });

            closeBtn.onclick = () => modal.classList.remove('active');
            modal.onclick = (e) => {
                if (e.target === modal) modal.classList.remove('active');
            };
        }

        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) themeBtn.addEventListener('click', () => this.toggleTheme());

        // Keyboard Navigation
        document.addEventListener('keydown', (e) => {
            if (this.views.quiz.classList.contains('active')) {
                if (e.key === 'ArrowRight' && !this.elements.nextBtn.disabled) {
                    this.nextQuestion();
                } else if (e.key === 'ArrowLeft' && !this.elements.prevBtn.disabled) {
                    this.prevQuestion();
                } else if (['1', '2', '3', '4', 'a', 'b', 'c', 'd'].includes(e.key.toLowerCase())) {
                    const map = { '1': 0, 'a': 0, '2': 1, 'b': 1, '3': 2, 'c': 2, '4': 3, 'd': 3 };
                    const idx = map[e.key.toLowerCase()];
                    const buttons = this.elements.optionsGrid.querySelectorAll('.option-btn');
                    if (buttons[idx] && !buttons[idx].disabled) {
                        buttons[idx].click();
                    }
                }
            }
        });
    }

    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        this.updateThemeIcon(next);
        if (this.views.results.classList.contains('active')) {
            this.updateResultCircle();
        }
    }

    updateThemeIcon(theme) {
        const btn = document.getElementById('theme-toggle');
        if (btn) {
            btn.innerHTML = theme === 'light' ? '<i class="ri-moon-line"></i>' : '<i class="ri-sun-line"></i>';
        }
    }

    renderVideoGrid() {
        if (!this.elements.videoGrid) return;
        this.elements.videoGrid.innerHTML = '';

        if (typeof window.VIDEO_DATA === 'undefined') return;

        window.VIDEO_DATA.forEach(video => {
            const card = document.createElement('div');
            card.className = 'glass-panel study-item video-card';
            card.style.overflow = 'hidden';
            card.style.transition = 'transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1), box-shadow 0.4s ease';

            // Premium Thumbnail Logic
            let thumbnailHTML = '';
            const hue = (video.index * 25) % 360;
            const gradientHTML = `
                <div class="video-fallback" style="position:relative; width:100%; aspect-ratio:16/9; background: linear-gradient(135deg, hsl(${hue}, 60%, 25%), hsl(${hue}, 80%, 15%)); display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center;">
                    <div style="position:absolute; inset:0; background: radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%);"></div>
                    <i class="ri-film-line" style="font-size:3.5rem; color:rgba(255,255,255,0.15); margin-bottom:0.5rem;"></i>
                    <h1 style="color:rgba(255,255,255,0.8); font-size:3rem; margin:0; line-height:1; font-weight:900; opacity:0.2;">${String(video.index).padStart(2, '0')}</h1>
                    <div class="play-indicator" style="position:absolute; width:54px; height:54px; background:var(--primary); border-radius:50%; display:flex; justify-content:center; align-items:center; box-shadow: 0 10px 20px rgba(0,0,0,0.4);">
                        <i class="ri-play-fill" style="color:white; font-size:26px; margin-left:4px;"></i>
                    </div>
                </div>`;

            if (video.id) {
                thumbnailHTML = `
                    <div class="video-thumb-container" style="position:relative; width:100%; aspect-ratio:16/9; overflow:hidden;">
                        <img src="https://img.youtube.com/vi/${video.id}/maxresdefault.jpg" 
                             style="width:100%; height:100%; object-fit:cover; transition: transform 0.6s ease;" 
                             alt="${video.title}"
                             onerror="this.src='https://img.youtube.com/vi/${video.id}/hqdefault.jpg'; this.onerror=function(){this.parentElement.style.display='none'; this.parentElement.nextElementSibling.style.display='flex'};">
                        <div class="thumb-overlay" style="position:absolute; inset:0; background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%); display:flex; align-items:flex-end; padding:1.25rem; opacity:0; transition: opacity 0.3s ease;">
                             <div style="width:40px; height:40px; background:var(--primary); border-radius:50%; display:flex; justify-content:center; align-items:center;">
                                <i class="ri-play-fill" style="color:white; font-size:20px; margin-left:2px;"></i>
                             </div>
                        </div>
                        <div style="position:absolute; top:1rem; right:1rem; padding:4px 10px; background:rgba(0,0,0,0.7); backdrop-filter:blur(4px); border-radius:6px; color:white; font-family:'JetBrains Mono'; font-size:0.75rem; font-weight:700;">
                            Chapter ${video.index}
                        </div>
                    </div>
                    <div class="video-fallback-wrapper" style="display:none; width:100%;">${gradientHTML}</div>`;
            } else {
                thumbnailHTML = gradientHTML;
            }

            card.innerHTML = `
                ${thumbnailHTML}
                <div style="padding: 1.5rem; background: var(--bg-card);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                         <span class="mono" style="color:var(--primary); font-size:0.7rem;">CALIFORNIA DMV 2026</span>
                    </div>
                    <h4 style="font-size:1.15rem; margin-bottom:0.5rem; color:var(--text-bright); font-weight:800; line-height:1.3;">${video.title}</h4>
                    <p style="font-size:0.9rem; color:var(--text-muted); line-height:1.5; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${video.desc}</p>
                </div>
            `;

            card.onmouseenter = () => {
                const img = card.querySelector('img');
                const overlay = card.querySelector('.thumb-overlay');
                if (img) img.style.transform = 'scale(1.1)';
                if (overlay) overlay.style.opacity = '1';
                card.style.transform = 'translateY(-10px)';
                card.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
            };
            card.onmouseleave = () => {
                const img = card.querySelector('img');
                const overlay = card.querySelector('.thumb-overlay');
                if (img) img.style.transform = 'scale(1)';
                if (overlay) overlay.style.opacity = '0';
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = 'var(--shadow-sm)';
            };

            card.onclick = () => this.playVideo(video.id || null, video.index - 1);
            this.elements.videoGrid.appendChild(card);
        });
    }

    playVideo(videoId, index) {
        window.scrollTo({ top: 0, behavior: 'smooth' });

        const wrapper = document.querySelector('.video-container-wrapper');
        // We use window.location.origin to satisfy the 'origin' parameter requirement
        // CRITICAL FIX: If running on file:// protocol, do NOT send origin, as it causes Error 153.
        let originParam = '';
        if (window.location.protocol !== 'file:') {
            originParam = `&origin=${window.location.origin}`;
        }

        if (wrapper) {
            wrapper.style.display = 'block';
            let src = '';

            // PROTOCOL CHECK (Fix for Error 153)
            const isLocalFile = window.location.protocol === 'file:';
            const playlistId = 'PLQ1Te15vCFqFvsP6eaO3p9fHyd_6UsnS5';

            if (videoId) {
                // Individual video embed
                src = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`;
            } else {
                // Fallback for playlist
                src = `https://www.youtube.com/embed/videoseries?list=${playlistId}&index=${index}`;
            }

            console.log('Loading Video:', src);

            let localWarning = '';
            if (isLocalFile) {
                localWarning = `
                    <div style="margin-top: 20px; padding: 15px; background: rgba(255,165,0,0.1); border: 1px dashed orange; border-radius: 12px; font-size: 0.9rem; color: #ff9800; text-align: left;">
                        <p style="margin: 0 0 10px 0; font-weight: 700;">⚠️ YouTube is blocking the video player (Error 153)</p>
                        <p style="margin: 0;">This happens because you are opening the file directly. To fix this:</p>
                        <ol style="margin: 10px 0; padding-left: 20px;">
                            <li>Open your terminal</li>
                            <li>Run: <code>python3 run_locally.py</code></li>
                            <li>This will open the site on <b>http://localhost:8000</b> where videos work perfectly!</li>
                        </ol>
                    </div>
                `;
            }

            wrapper.innerHTML = `
                <div class="video-responsive">
                    <iframe 
                        width="100%" 
                        height="100%" 
                        src="${src}" 
                        title="DMV Video Course" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>
                <div style="text-align: center; margin-top: 15px;">
                    <a href="https://www.youtube.com/watch?v=${videoId || ''}&list=${playlistId}&index=${index + 1}" target="_blank" class="glass-panel" style="display: inline-flex; align-items: center; gap: 8px; text-decoration: none; padding: 10px 20px; color: var(--text); border-radius: 30px; font-weight: 600;">
                        <i class="ri-youtube-fill" style="color: #ff0000; font-size: 1.2rem;"></i> Watch on YouTube (Full Screen)
                    </a>
                </div>
                ${localWarning}
            `;
        }
    }

    showView(viewName) {
        Object.keys(this.views).forEach(v => {
            const el = this.views[v];
            if (el) {
                const isActive = v === viewName;
                el.classList.toggle('active', isActive);
                el.classList.toggle('hidden', !isActive);

                if (isActive) {
                    el.style.opacity = '0';
                    setTimeout(() => {
                        el.style.transition = 'opacity 0.3s ease';
                        el.style.opacity = '1';
                    }, 10);
                }
            }
        });
        window.scrollTo(0, 0);
    }

    showSubSections(setId) {
        const setData = window.QUIZ_DATA[setId];
        if (!setData) return;

        this.currentSetId = setId;
        const subTitle = document.getElementById('sub-category-title');
        if (subTitle) subTitle.textContent = setData.title;

        const grid = document.getElementById('parts-grid');
        if (!grid) return;
        grid.innerHTML = '';

        setData.parts.forEach((part, index) => {
            const partCard = document.createElement('div');
            partCard.className = 'part-card'; // CSS handles hover and glass
            partCard.innerHTML = `
                <div class="part-num-wrapper">${index + 1}</div>
                <div class="card-content">
                    <h3 style="margin-bottom: 0.25rem;">Practice Part ${index + 1}</h3>
                    <p class="mono" style="font-size: 0.85rem; opacity: 0.7;">Focus session with ${part.length} hand-picked questions.</p>
                </div>
                <div style="margin-left: auto;">
                    <span class="mono" style="color:var(--primary); font-weight:700;">START <i class="ri-arrow-right-line"></i></span>
                </div>
            `;
            partCard.addEventListener('click', () => this.startQuiz(setId, index));
            grid.appendChild(partCard);
        });

        this.showView('subSelection');
    }

    startQuiz(setId, partIndex) {
        this.currentSetId = setId;
        this.currentPartIndex = partIndex;
        try {
            const set = window.QUIZ_DATA[setId];
            let data = set ? set.parts[partIndex] : null;

            if (!data || data.length === 0) throw new Error('No questions found.');

            // Deep clone and Shuffle Questions
            this.currentSet = this.shuffleArray([...data]).map(q => {
                const originalOptions = [...q.options];
                const correctAnswerText = originalOptions[q.answer];
                const shuffledOptions = this.shuffleArray([...originalOptions]);
                const newAnswerIndex = shuffledOptions.indexOf(correctAnswerText);

                return {
                    ...q,
                    options: shuffledOptions,
                    answer: newAnswerIndex
                };
            });

            this.currentQuestionIndex = 0;
            this.score = 0;
            this.userAnswers = new Array(this.currentSet.length).fill(null);

            this.renderQuestion();
            this.showView('quiz');
        } catch (error) {
            console.error('Quiz Load Error:', error);
            alert('Could not load quiz data.');
            this.showView('home');
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    renderQuestion() {
        const question = this.currentSet[this.currentQuestionIndex];
        if (!question) return;

        const userAnswer = this.userAnswers[this.currentQuestionIndex];

        this.elements.currentQ.textContent = this.currentQuestionIndex + 1;
        this.elements.totalQ.textContent = this.currentSet.length;
        this.elements.scoreTracker.textContent = `Score: ${this.score}`;
        const progress = ((this.currentQuestionIndex + 1) / this.currentSet.length) * 100;
        this.elements.progressBar.style.width = `${progress}%`;

        this.elements.questionText.textContent = question.question;

        if (question.image) {
            this.elements.questionImage.onerror = () => { this.elements.imageContainer.style.display = 'none'; };
            this.elements.questionImage.onload = () => { this.elements.imageContainer.style.display = 'flex'; };
            this.elements.questionImage.src = question.image;
        } else {
            this.elements.imageContainer.style.display = 'none';
        }

        this.elements.optionsGrid.innerHTML = '';
        this.elements.explanationBox.style.display = 'none';

        question.options.forEach((opt, index) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerHTML = `<span class="option-circle">${String.fromCharCode(65 + index)}</span><span class="option-text">${opt}</span>`;

            if (userAnswer) {
                btn.disabled = true;
                if (index === question.answer) {
                    btn.classList.add('correct');
                    btn.querySelector('.option-circle').innerHTML = '<i class="ri-check-line"></i>';
                } else if (index === userAnswer.selectedOptionIndex) {
                    btn.classList.add('wrong');
                    btn.querySelector('.option-circle').innerHTML = '<i class="ri-close-line"></i>';
                }
            } else {
                btn.onclick = () => this.handleAnswer(index, btn);
            }
            this.elements.optionsGrid.appendChild(btn);
        });

        if (userAnswer) {
            this.showFeedback(userAnswer.isCorrect, question.explanation);
        }

        this.elements.prevBtn.disabled = this.currentQuestionIndex === 0;
        this.elements.nextBtn.innerHTML = this.currentQuestionIndex === this.currentSet.length - 1 ? 'Finish <i class="ri-flag-line"></i>' : 'Next <i class="ri-arrow-right-line"></i>';
    }

    handleAnswer(selectedIndex, btnElement) {
        const question = this.currentSet[this.currentQuestionIndex];
        const isCorrect = selectedIndex === question.answer;

        this.userAnswers[this.currentQuestionIndex] = {
            questionIndex: this.currentQuestionIndex,
            selectedOptionIndex: selectedIndex,
            isCorrect: isCorrect
        };

        if (isCorrect) this.score++;

        const buttons = this.elements.optionsGrid.querySelectorAll('.option-btn');
        buttons.forEach((btn, idx) => {
            btn.disabled = true;
            if (idx === question.answer) {
                btn.classList.add('correct');
                btn.querySelector('.option-circle').innerHTML = '<i class="ri-check-line"></i>';
            } else if (idx === selectedIndex) {
                btn.classList.add('wrong');
                btn.querySelector('.option-circle').innerHTML = '<i class="ri-close-line"></i>';
            }
        });

        this.showFeedback(isCorrect, question.explanation);
        this.elements.scoreTracker.textContent = `Score: ${this.score}`;
    }

    showFeedback(isCorrect, explanation) {
        this.elements.explanationBox.style.display = 'block';
        this.elements.explanationBox.className = 'explanation-box active ' + (isCorrect ? 'correct' : 'wrong');

        const icon = isCorrect ? 'ri-checkbox-circle-fill' : 'ri-close-circle-fill';
        const title = isCorrect ? 'Excellent! Correct' : 'Not Quite Right';
        const accentColor = isCorrect ? 'var(--text-bright)' : 'var(--text-muted)';
        const statusColor = isCorrect ? 'var(--correct)' : 'var(--wrong)';

        const isLast = this.currentQuestionIndex === this.currentSet.length - 1;
        const buttonText = isLast ? 'FINISH EXAM' : 'NEXT QUESTION';
        const buttonIcon = isLast ? 'ri-flag-line' : 'ri-arrow-right-line';

        this.elements.explanationBox.innerHTML = `
            <div class="feedback-content">
                <div class="feedback-header">
                    <div class="feedback-status" style="color:${statusColor}">
                        <i class="${icon}"></i>
                        <span>${title}</span>
                    </div>
                </div>
                
                <div class="feedback-body">
                    <p>${explanation}</p>
                </div>

                <div class="feedback-actions">
                    <button class="quiz-btn primary next-trigger">
                        ${buttonText} <i class="${buttonIcon}"></i>
                    </button>
                </div>
            </div>
        `;

        // Attach listener to the new button
        const btn = this.elements.explanationBox.querySelector('.next-trigger');
        if (btn) btn.onclick = () => this.nextQuestion();
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.currentSet.length - 1) {
            this.currentQuestionIndex++;
            this.renderQuestion();
        } else {
            this.showResults();
        }
    }

    prevQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.renderQuestion();
        }
    }

    showResults() {
        const total = this.currentSet.length;
        const percent = Math.round((this.score / total) * 100);
        this.elements.finalPercent.textContent = `${percent}%`;
        this.elements.totalCorrect.textContent = this.score;
        this.elements.totalWrong.textContent = total - this.score;
        this.updateResultCircle(percent);
        this.renderReview();
        this.showView('results');
    }

    renderReview() {
        const container = this.elements.reviewContainer;
        const list = this.elements.reviewList;
        list.innerHTML = '';
        const wrongAnswers = this.userAnswers.map((ans, idx) => ({ ...ans, originalIdx: idx })).filter(ans => ans && !ans.isCorrect);
        if (wrongAnswers.length === 0) {
            container.classList.add('hidden');
            return;
        }
        container.classList.remove('hidden');
        wrongAnswers.forEach(item => {
            const question = this.currentSet[item.originalIdx];
            const div = document.createElement('div');
            div.className = 'review-item';
            div.innerHTML = `
                <div class="review-question"><span style="color:var(--primary)">Q${item.originalIdx + 1}.</span> ${question.question}</div>
                <div class="review-answer user-wrong"><i class="ri-close-circle-line"></i> You chose: ${question.options[item.selectedOptionIndex]}</div>
                <div class="review-answer correct-answer"><i class="ri-checkbox-circle-line"></i> Correct: ${question.options[question.answer]}</div>
                <div class="review-explanation">${question.explanation}</div>
            `;
            list.appendChild(div);
        });
    }

    updateResultCircle(percentValue) {
        let percent = percentValue;
        if (percent === undefined) {
            const total = this.currentSet.length;
            if (total === 0) return;
            percent = Math.round((this.score / total) * 100);
        }
        const circle = document.querySelector('.accuracy-circle');
        if (!circle) return;
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const trackColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
        circle.style.background = `conic-gradient(var(--primary) ${percent}%, ${trackColor} ${percent}%)`;
    }

    openLightbox(imgSrc) {
        const lightbox = document.getElementById('lightbox');
        const img = document.getElementById('lightbox-img');
        if (lightbox && img) {
            img.src = imgSrc;
            lightbox.classList.add('active');
            lightbox.style.display = 'flex';
        }
    }

    closeLightbox() {
        const lightbox = document.getElementById('lightbox');
        if (lightbox) {
            lightbox.classList.remove('active');
            lightbox.style.display = 'none';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => { window.app = new QuizApp(); });
