        // Simple single-file navigation (hash + data-target)
        (function(){
            const links = document.querySelectorAll('nav a');
            const pages = document.querySelectorAll('section.page');

            function setActive(targetId){
                pages.forEach(p => p.id === targetId ? p.classList.add('active') : p.classList.remove('active'));
                links.forEach(a => a.dataset.target === targetId ? a.classList.add('active') : a.classList.remove('active'));
            }

            // on load: respect hash
            const initial = location.hash ? location.hash.replace('#','') : 'home';
            setActive(initial);

            // attach clicks
            links.forEach(a=>{
                a.addEventListener('click', (e)=>{
                    e.preventDefault();
                    const tgt = a.dataset.target;
                    history.pushState(null, '', '#'+tgt);
                    setActive(tgt);
                });
            });

            // handle back/forward
            window.addEventListener('popstate', ()=> {
                const cur = location.hash ? location.hash.replace('#','') : 'home';
                setActive(cur);
            });
        })();

        // Small UI helpers: expandable cards and animated details
        (function(){
            // Expandable Experience card toggle
            const toggles = document.querySelectorAll('.card-toggle');
            toggles.forEach(btn => {
                const targetId = btn.getAttribute('aria-controls');
                const target = targetId ? document.getElementById(targetId) : null;
                function setExpanded(expanded){
                    btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
                    if(!target) return;
                    if(expanded){
                        target.hidden = false;
                        // allow transition: set max-height to scrollHeight
                        requestAnimationFrame(()=>{
                            target.classList.add('expanded');
                        });
                    } else {
                        target.classList.remove('expanded');
                        // after transition hide to prevent tab stops
                        setTimeout(()=>{ if(!target.classList.contains('expanded')) target.hidden = true; }, 300);
                    }
                }
                btn.addEventListener('click', ()=>{ setExpanded(btn.getAttribute('aria-expanded') !== 'true'); });
                btn.addEventListener('keydown', (e)=>{ if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); } });
            });

            // Animate <details> open/close by toggling max-height on the .content child
            const collapsibles = document.querySelectorAll('details.collapsible');
            collapsibles.forEach(d => {
                const content = d.querySelector('.content');
                if(!content) return;
                function update(){
                    if(d.hasAttribute('open')){
                        // open -> set max-height to scrollHeight for smooth reveal
                        const h = content.scrollHeight;
                        content.style.maxHeight = h + 'px';
                        content.style.opacity = '1';
                    } else {
                        // close -> collapse
                        content.style.maxHeight = '0px';
                        content.style.opacity = '0';
                    }
                }
                // initial
                update();
                d.addEventListener('toggle', update);
            });
        })();

        

        // Gallery navigation and gallery toggles
        (function(){
            // Gallery toggles (expand/collapse thumb grids)
            const galleryToggles = document.querySelectorAll('.gallery-toggle');
            galleryToggles.forEach(btn => {
                const targetId = btn.getAttribute('aria-controls');
                const target = targetId ? document.getElementById(targetId) : null;
                function setExpanded(expanded){
                    btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
                    btn.textContent = expanded ? 'Hide ▲' : 'Show ▼';
                    if(!target) return;
                    if(expanded){ target.hidden = false; requestAnimationFrame(()=> target.classList.add('expanded')); }
                    else { target.classList.remove('expanded'); setTimeout(()=>{ if(!target.classList.contains('expanded')) target.hidden = true; }, 300); }
                }
                btn.addEventListener('click', ()=> setExpanded(btn.getAttribute('aria-expanded') !== 'true'));
            });

            // Gallery-aware modal navigation
            const modal = document.getElementById('project-modal');
            const modalImg = document.getElementById('project-modal-img');
            const modalIframe = document.getElementById('project-modal-iframe');
            const modalCaption = document.getElementById('project-modal-caption');
            const modalClose = document.getElementById('project-modal-close');
            if(!modal) return;

            // add prev/next buttons to modal content
            const modalContent = modal.querySelector('.project-modal-content');
            const prevBtn = document.createElement('button'); prevBtn.className = 'modal-nav prev'; prevBtn.setAttribute('aria-label','Previous image'); prevBtn.textContent = '‹';
            const nextBtn = document.createElement('button'); nextBtn.className = 'modal-nav next'; nextBtn.setAttribute('aria-label','Next image'); nextBtn.textContent = '›';
            modalContent.appendChild(prevBtn); modalContent.appendChild(nextBtn);

            let currentGallery = null; // NodeList of anchors
            let currentIndex = 0;

            function openGalleryAt(galleryId, index){
                const galleryNodes = document.querySelectorAll(`[data-gallery="${galleryId}"] .project-link`);
                // fallback: if galleryNodes empty, try anchors with data-gallery attr
                let items = galleryNodes;
                if(!items || items.length === 0){
                    items = document.querySelectorAll(`.project-link[data-gallery="${galleryId}"]`);
                }
                currentGallery = Array.from(items);
                if(!currentGallery || currentGallery.length === 0) return;
                currentIndex = Math.max(0, Math.min(index, currentGallery.length - 1));
                const src = currentGallery[currentIndex].getAttribute('data-img');
                const titleEl = currentGallery[currentIndex].querySelector('img') || currentGallery[currentIndex].querySelector('strong');
                const caption = titleEl ? (titleEl.alt || titleEl.textContent || '') : '';
                showModalImage(src, caption);
            }

            function showModalImage(src, caption){
                modal.setAttribute('aria-hidden','false');
                modalCaption.textContent = caption || '';
                if(src && src.match(/\.pdf$/i)){
                    if(modalIframe){ modalIframe.style.display = 'block'; modalIframe.src = src; }
                    if(modalImg) modalImg.style.display = 'none';
                } else {
                    if(modalIframe){ modalIframe.style.display = 'none'; modalIframe.src = ''; }
                    if(modalImg){ modalImg.style.display = 'block'; modalImg.src = src || ''; modalImg.alt = caption || 'Project preview'; }
                }
                prevBtn.disabled = (currentGallery && currentGallery.length <= 1);
                nextBtn.disabled = (currentGallery && currentGallery.length <= 1);
                modalClose.focus();
            }

            function closeModal(){ modal.setAttribute('aria-hidden','true'); modalImg.src=''; modalCaption.textContent=''; }

            // click handler for thumbnails / card anchors
            document.querySelectorAll('.thumb-grid .project-link, .card > .project-link').forEach(a => {
                a.addEventListener('click', (e)=>{
                    e.preventDefault();
                    // determine gallery id: find ancestor .thumb-grid with data-gallery or parent card data-gallery
                    const thumb = a.closest('.thumb-grid');
                    if(thumb && thumb.dataset && thumb.dataset.gallery){
                        const galleryId = thumb.dataset.gallery;
                        // find index among anchors inside that thumb-grid
                        const nodes = Array.from(thumb.querySelectorAll('.project-link'));
                        const idx = nodes.indexOf(a);
                        currentGallery = nodes;
                        currentIndex = idx >= 0 ? idx : 0;
                        const src = a.getAttribute('data-img');
                        const caption = a.querySelector('img') ? a.querySelector('img').alt : (a.textContent || a.getAttribute('data-img') || '').trim();
                        showModalImage(src, caption);
                        modal.setAttribute('aria-hidden','false');
                    } else {
                        // card-level link (not in thumb-grid): find other anchors with same gallery via data-img path grouping
                        const parentCard = a.closest('.card');
                        const galleryNodes = parentCard ? Array.from(parentCard.querySelectorAll('.thumb-grid .project-link')) : [];
                        if(galleryNodes.length){
                            currentGallery = galleryNodes; currentIndex = 0;
                            const src = a.getAttribute('data-img');
                            showModalImage(src, a.querySelector('strong') ? a.querySelector('strong').textContent : '');
                        } else {
                            // fallback open single image
                            const src = a.getAttribute('data-img');
                            showModalImage(src, a.querySelector('strong') ? a.querySelector('strong').textContent : '');
                        }
                    }
                });
            });

            // prev/next handlers
            prevBtn.addEventListener('click', ()=>{
                if(!currentGallery) return;
                currentIndex = (currentIndex - 1 + currentGallery.length) % currentGallery.length;
                const src = currentGallery[currentIndex].getAttribute('data-img');
                const caption = currentGallery[currentIndex].querySelector('img') ? currentGallery[currentIndex].querySelector('img').alt : (currentGallery[currentIndex].textContent || currentGallery[currentIndex].getAttribute('data-img') || '').trim();
                showModalImage(src, caption);
            });
            nextBtn.addEventListener('click', ()=>{
                if(!currentGallery) return;
                currentIndex = (currentIndex + 1) % currentGallery.length;
                const src = currentGallery[currentIndex].getAttribute('data-img');
                const caption = currentGallery[currentIndex].querySelector('img') ? currentGallery[currentIndex].querySelector('img').alt : (currentGallery[currentIndex].textContent || currentGallery[currentIndex].getAttribute('data-img') || '').trim();
                showModalImage(src, caption);
            });

            // backdrop and close
            const backdrop = modal.querySelector('.project-modal-backdrop');
            if(backdrop) backdrop.addEventListener('click', closeModal);
            modalClose.addEventListener('click', closeModal);

            // keyboard navigation
            document.addEventListener('keydown', (e)=>{
                if(modal.getAttribute('aria-hidden') === 'false'){
                    if(e.key === 'ArrowLeft') prevBtn.click();
                    if(e.key === 'ArrowRight') nextBtn.click();
                    if(e.key === 'Escape') closeModal();
                }
            });
        })();

        // Theme toggle (light / dark) — persists to localStorage
        (function(){
            const btn = document.getElementById('themeToggle');
            if(!btn) return;
            const stored = localStorage.getItem('theme');
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            let theme = stored || (prefersDark ? 'dark' : 'light');
            document.documentElement.setAttribute('data-theme', theme);
            function updateButton(){
                if(theme === 'dark'){
                    btn.textContent = '🌞 Light';
                    btn.setAttribute('aria-pressed','true');
                } else {
                    btn.textContent = '🌙 Dark';
                    btn.setAttribute('aria-pressed','false');
                }
            }
            updateButton();
            btn.addEventListener('click', ()=>{
                theme = theme === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', theme);
                localStorage.setItem('theme', theme);
                updateButton();
            });
        })();

        // Interactive SVG 4-circle Venn (from wip/index0.html)
        (function(){
            const circles = {
                A: {el: document.getElementById('circle-A'), cx:300, cy:280, r:160, name:'What I’m good at '},
                B: {el: document.getElementById('circle-B'), cx:500, cy:280, r:160, name:'What the world needs '},
                C: {el: document.getElementById('circle-C'), cx:400, cy:160, r:160, name:'What I Love'},
                D: {el: document.getElementById('circle-D'), cx:400, cy:400, r:160, name:'What I can be paid for '}
            };

            const svg = document.getElementById('venn-svg');
            const popup = document.getElementById('popup');
            const popupTitle = document.getElementById('popup-title');
            const popupContent = document.getElementById('popup-content');
            const closePopupBtn = document.getElementById('close-popup');
            const svgWrap = document.querySelector('.svg-wrap');

            const contentMap = {
                'A': 'I’m skilled with creating illustrations and writing creatively.  I have a good understanding of what and how to do it once envisioned. I excel at constant communication and collaboration, which helps me get the idea alive. I’m also pretty skilled with short animations, which I’m still currently practicing. I have a creative mind for writing as well.',
                'B': 'As technology evolves, it creates demands on creativity and innovation that are not just pleasing to the eyes, but also has an impact on everyone. To achieve this, I aim to create outstanding ideas that are relevant and meaningful through colors and stories.',
                'C': 'I grew up entranced with art, whether it may be visual art (paintings, illustrations), poetries and creative stories, architecture, movies, animation, and music. ',
                'D': 'In the field of creatives, multiple opportunities are available for me. I can be a professional illustrator, animator, and digital content creator. These careers allow me to use my creativity and showcase my skills in making art related works. ',
                'AB': '',
                'AC': 'I am passionate about visual arts and writing, and I want my creations to be meaningful and impactful. By the end of my first academic year, I aim to produce several unique art and writing pieces while consistently practicing to strengthen my skills and build a strong portfolio.',
                'AD': 'I want to build a creative career by improving my artistic and writing abilities and growing a professional presence online. Throughout my four academic years, I plan to create multiple works, use various learning resources, and prepare myself for future opportunities in the creative industry.',
                'BC': 'My mission is to create meaningful content that promotes cultural awareness and breaks stereotypes. Using my academic projects as platforms, I will produce zines, essays, and artworks that positively impact people and reflect my values by the end of my first year.',
                'BD': 'I aim to offer my creativity as a service through freelancing. By using social media to find clients, I plan to complete commissions and collaborations that will help me establish myself as an artist by the end of my first academic year.',
                'CD': '',
                'ABC': 'As a creative, I’m comfortable with my current skills if it were to compare with my previous ones. But it’s not as impactful as it seems. I plan to improve my skills not solely for my own satisfaction but to be job-ready in the future.',
                'ABD': 'Being able to go to CIIT has been a constant reminder of how far I’ve become ever since I started to learn arts and the feeling has been great, yet there is still a part of me that is unfulfilled with myself due to insecurities and with my current skills. I want to unlearn bad habits of belittling myself and start to believe in myself by reminding myself of my milestones. ',
                'ACD': 'As a creative, I’m comfortable with my current skills if it were to compare with my previous ones. But it’s not as impactful as it seems. I plan to improve my skills not solely for my own satisfaction but to be job-ready in the future.',
                'BCD': 'Becoming a BMMA student here at CIIT gives me excitement at first for I am studying in a school that I know will help me grow artistically but the journey towards it makes me lose my spark and reasons on why I took this in the first place. I’m learning how to take a step back and breathe before continuing on this path so that I can appreciate where I am now and how far I’ve been.',
                'ABCD': 'My vision as a creative is more than just to produce, but to evoke feelings through art. The best way to bring my goals to life is through Mindmap. My personal journey as a creative involves more on collaborating which helps me learn from others, being a team player, and constant learning. These qualities are to be valued for it can help you, as a person, to improve.'
            };

            function getSVGPoint(evt){
                const pt = svg.createSVGPoint();
                pt.x = evt.clientX; pt.y = evt.clientY;
                const ctm = svg.getScreenCTM();
                if(!ctm) return {x:evt.clientX, y:evt.clientY};
                const inv = ctm.inverse();
                const loc = pt.matrixTransform(inv);
                return {x: loc.x, y: loc.y};
            }

            function pick(point){
                const picked = [];
                for(const key of Object.keys(circles)){
                    const c = circles[key];
                    const dx = point.x - c.cx;
                    const dy = point.y - c.cy;
                    if (dx*dx + dy*dy <= c.r*c.r + 0.0001) picked.push(key);
                }
                return picked.sort().join('');
            }

            function clearPop(){
                Object.values(circles).forEach(c => {
                    if(c && c.el){
                        c.el.classList.remove('popped');
                        c.el.classList.remove('inactive');
                    }
                });
            }

            function popSelection(keys){
                clearPop();
                const keep = new Set(keys.filter(Boolean));
                // mark selected as popped
                for(const k of keep){ if(circles[k] && circles[k].el) circles[k].el.classList.add('popped'); }
                // dim others
                Object.keys(circles).forEach(k=>{
                    if(!keep.has(k) && circles[k] && circles[k].el) circles[k].el.classList.add('inactive');
                });
            }
            function titleFor(keyString){ if(!keyString) return 'Nothing here'; const names = keyString.split('').map(k => circles[k].name); return names.join(' + '); }

            function showPopupFor(keyString, clientX, clientY){
                const key = keyString || '';
                popupTitle.textContent = key ? titleFor(key) : 'Nothing';
                popupContent.textContent = contentMap[key] || (key ? ('A combined area: ' + titleFor(key)) : 'No domains here.');
                popup.classList.add('show'); popup.setAttribute('aria-hidden','false'); popSelection(key.split(''));

                const wrapRect = svgWrap.getBoundingClientRect();
                const popupRect = popup.getBoundingClientRect();
                let left = clientX - wrapRect.left + 12;
                let top = clientY - wrapRect.top - popupRect.height - 12;
                if (top < 6) top = clientX - wrapRect.top + 12; // fallback below pointer
                left = Math.max(6, Math.min(left, wrapRect.width - popupRect.width - 6));
                top = Math.max(6, Math.min(top, wrapRect.height - popupRect.height - 6));
                popup.style.left = left + 'px'; popup.style.top = top + 'px';
            }

            function hidePopup(){ popup.classList.remove('show'); popup.setAttribute('aria-hidden','true'); clearPop(); }
            // helper to clear legend button active state
            function clearLegendActive(){
                const btns = document.querySelectorAll('.legend-btn');
                btns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed','false'); });
            }

            let lastKey = '';
            // when locked, the popup stays until explicitly closed
            let isLocked = false;

            // Legend hover/focus: show corresponding domain popup
            const legendItems = document.querySelectorAll('.venn-info [data-region]');
            legendItems.forEach(el => {
                // make focusable for keyboard users
                if(!el.hasAttribute('tabindex')) el.setAttribute('tabindex','0');
                el.addEventListener('pointerenter', (ev)=>{
                    if(isLocked) return;
                    const region = el.dataset.region;
                    const r = el.getBoundingClientRect();
                    const cx = r.left + r.width/2;
                    const cy = r.top + r.height/2;
                    // hide close button for hover
                    if(closePopupBtn) closePopupBtn.style.display = 'none';
                    showPopupFor(region, cx, cy);
                });
                el.addEventListener('pointerleave', ()=>{ if(!isLocked) hidePopup(); });
                el.addEventListener('focus', ()=>{
                    if(isLocked) return;
                    const region = el.dataset.region;
                    const r = el.getBoundingClientRect();
                    showPopupFor(region, r.left + r.width/2, r.top + r.height/2);
                });
                el.addEventListener('blur', ()=>{ if(!isLocked) hidePopup(); });
                // click on legend locks selection and highlights that legend button
                el.addEventListener('click', (ev)=>{
                    ev.preventDefault();
                    const region = el.dataset.region;
                    const r = el.getBoundingClientRect();
                    const already = el.classList.contains('active');
                    if(already){
                        // toggle off
                        el.classList.remove('active'); el.setAttribute('aria-pressed','false');
                        isLocked = false; hidePopup(); if(closePopupBtn) closePopupBtn.style.display = 'none';
                        clearLegendActive();
                        return;
                    }
                    // activate this legend button only
                    clearLegendActive();
                    el.classList.add('active'); el.setAttribute('aria-pressed','true');
                    isLocked = true;
                    if(closePopupBtn) closePopupBtn.style.display = '';
                    showPopupFor(region, r.left + r.width/2, r.top + r.height/2);
                });
            });

            svg.addEventListener('pointermove', function(evt){
                if(isLocked) return; // don't update hover while selection is locked
                const pt = getSVGPoint(evt);
                const picked = pick(pt);
                if(!picked){ if(lastKey !== ''){ lastKey = ''; hidePopup(); } return; }
                if(picked === lastKey){ showPopupFor(picked, evt.clientX, evt.clientY); return; }
                lastKey = picked; showPopupFor(picked, evt.clientX, evt.clientY);
            });

            svg.addEventListener('pointerleave', function(){ if(!isLocked){ lastKey = ''; hidePopup(); } });

            // click to lock selection (useful for selecting overlaps like two-circle areas)
            svg.addEventListener('click', function(evt){
                const pt = getSVGPoint(evt);
                const picked = pick(pt);
                if(!picked){ isLocked = false; hidePopup(); if(closePopupBtn) closePopupBtn.style.display = 'none'; clearLegendActive(); return; }
                isLocked = true;
                // highlight corresponding legend buttons for each selected circle
                clearLegendActive();
                for(const ch of picked.split('')){
                    const b = document.querySelector(`.legend-btn[data-region="${ch}"]`);
                    if(b){ b.classList.add('active'); b.setAttribute('aria-pressed','true'); }
                }
                showPopupFor(picked, evt.clientX, evt.clientY);
                if(closePopupBtn) closePopupBtn.style.display = '';
            });

            if(closePopupBtn){
                closePopupBtn.style.display = 'none';
                closePopupBtn.addEventListener('click', function(){ isLocked = false; hidePopup(); closePopupBtn.style.display = 'none'; });
            }

            Object.values(circles).forEach(c=>{
                if(!c.el) return;
                c.el.addEventListener('pointerenter', ()=> {
                    c.el.classList.add('hovered');
                    // dim other circles for focus
                    Object.values(circles).forEach(o=>{ if(o.el && o !== c) o.el.classList.add('inactive'); });
                });
                c.el.addEventListener('pointerleave', ()=> {
                    c.el.classList.remove('hovered');
                    // restore others
                    Object.values(circles).forEach(o=>{ if(o.el) o.el.classList.remove('inactive'); });
                });
            });

            document.addEventListener('keydown', function(e){ if(e.key === 'Escape'){ isLocked = false; hidePopup(); if(closePopupBtn) closePopupBtn.style.display = 'none'; } });
            document.addEventListener('click', function(e){ const svgEl = document.getElementById('venn-svg'); if(!svgEl.contains(e.target) && !isLocked) hidePopup(); });

        })();
