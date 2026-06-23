// ==========================================
// ЛОГИКА КАРТЫ (Россия, Кемеровская область, навигация)
// ==========================================

fetch('Blank_map_of_Russia-gray.svg')
    .then(res => res.text())
    .then(data => {
        wrapper.innerHTML = data;
        const svg = wrapper.querySelector('svg');
        const paths = svg.querySelectorAll('path');

        paths.forEach(path => {
            if (path.id.toLowerCase().includes('border')) {
                path.style.pointerEvents = 'none';
                return;
            }

            const rawId = path.getAttribute('id') || "";
            const name = (path.getAttribute('title') || rawId || "РЕГИОН").replace(/_/g, ' ');

            path.addEventListener('mouseenter', () => {
                tooltip.innerText = name;
                tooltip.style.opacity = '1';
            });

            path.addEventListener('mousemove', (e) => {
                tooltip.style.left = e.clientX + 20 + 'px';
                tooltip.style.top = e.clientY + 20 + 'px';
            });

            path.addEventListener('mouseleave', () => tooltip.style.opacity = '0');

            path.addEventListener('click', (e) => {

                if (document.body.classList.contains('scanning')) return;
                e.stopPropagation();

                toggleAuthPanel(false);
                wrapper.style.transition = 'opacity 0.6s ease';
                wrapper.style.opacity = '0';
                wrapper.style.pointerEvents = 'none';

                setTimeout(() => {
                    if (wrapper.style.opacity === '0') {
                        wrapper.style.display = 'none';
                    }
                }, 600);
                tooltip.style.opacity = '0';
                tooltip.style.visibility = 'hidden';
                document.body.classList.add('scanning');

                if (rawId === 'RU-KEM' || name.includes('Кемеровская')) {
                    fetch('Outline_Map_of_Kemerovo_Oblast.svg')
                        .then(r => r.text())
                        .then(svgKEM => {
                            regionalContainer.innerHTML = svgKEM;
                            regionalContainer.style.display = 'block';

                            document.body.classList.remove('scanning');

                            const kemSvg = regionalContainer.querySelector('svg');
                            if (kemSvg) {
                                kemSvg.style.pointerEvents = 'all';

                                const allPaths = kemSvg.querySelectorAll('path');
                                allPaths.forEach(el => {
                                    const label = el.getAttribute('inkscape:label') || "";

                                    if (label !== "Border") {
                                        el.style.cursor = 'pointer';

                                        el.onmouseenter = () => {
                                            tooltip.innerText = label;
                                            tooltip.style.opacity = '1';
                                            tooltip.style.visibility = 'visible';
                                        };

                                        el.onmousemove = (ev) => {
                                            tooltip.style.left = ev.clientX + 20 + 'px';
                                            tooltip.style.top = ev.clientY + 20 + 'px';
                                        };

                                        el.onmouseleave = () => {
                                            tooltip.style.opacity = '0';
                                            tooltip.style.visibility = 'hidden';
                                        };

                                        el.onclick = (ev) => {
                                            ev.stopPropagation();
                                            regionalContainer.classList.add('fade-out');

                                            fetch(`/api/map/centers-by-district?name=${encodeURIComponent(label)}`)
                                                .then(res => res.json())
                                                .then(data => {
                                                    setTimeout(() => {
                                                        regionalContainer.style.display = 'none';
                                                        regionalContainer.classList.remove('fade-out');
                                                        renderCenters(data);
                                                    }, 600);
                                                });
                                        };
                                    }
                                });
                            }

                            setTimeout(() => {
                                regionalContainer.style.opacity = '1';
                                backBtn.classList.add('visible');
                            }, 800);
                        });
                } else {
                    titleDisplay.innerText = name;
                    setTimeout(() => {
                        titleDisplay.classList.add('visible');
                        backBtn.classList.add('visible');
                    }, 100);
                }
            });
        });
    });

backBtn.addEventListener('click', () => {
    const centersView = document.getElementById('centers-view');

    if (centersView && centersView.style.display === 'block') {
        console.log("Запускаем плавный откат от карточек к карте Кемеровской области...");

        centersView.classList.add('fade-out');
        backBtn.classList.remove('visible');

        setTimeout(() => {
            centersView.style.display = 'none';
            centersView.style.opacity = '0';
            centersView.classList.remove('fade-out');

            if (regionalContainer) {
                regionalContainer.style.display = 'block';
                regionalContainer.style.opacity = '0';
                regionalContainer.style.pointerEvents = 'auto';

                setTimeout(() => {
                    regionalContainer.style.opacity = '1';
                    backBtn.classList.add('visible');
                    backBtn.style.opacity = '1';
                }, 50);
            }
        }, 500);

        return;
    }

    if ((regionalContainer && regionalContainer.style.display === 'block') || (titleDisplay && titleDisplay.classList.contains('visible'))) {
        console.log("Возвращаемся от карты области к карте России...");
        closeEverythingAndShowRussia();
    }
});

function closeEverythingAndShowRussia() {
    regionalContainer.style.opacity = '0';
    regionalContainer.style.pointerEvents = 'none';
    titleDisplay.classList.remove('visible');
    backBtn.classList.remove('visible');

    setTimeout(() => {
        regionalContainer.style.display = 'none';
        regionalContainer.innerHTML = '';
        titleDisplay.innerText = '';

        wrapper.style.display = 'block';

        setTimeout(() => {
            wrapper.style.opacity = '1';
            wrapper.style.pointerEvents = 'auto';
            wrapper.classList.remove('map-hidden');
            document.body.classList.remove('scanning');
            tooltip.style.visibility = 'visible';
            toggleAuthPanel(true);
        }, 50);

    }, 500);
}