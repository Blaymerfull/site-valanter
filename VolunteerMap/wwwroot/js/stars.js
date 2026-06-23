// ==========================================
// ТУМАН ИЗ СВЕТЯЩИХСЯ ЧАСТИЦ — анимированный фон
// ==========================================

(function() {
    'use strict';

    const canvas = document.createElement('canvas');
    canvas.id = 'stars-canvas';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId = null;
    let isVisible = true;

    // Параметры
    const PARTICLE_COUNT = 18;
    const MAX_RADIUS = 180;
    const MIN_RADIUS = 60;
    const DRIFT_SPEED = 0.08;
    const PULSE_SPEED_MIN = 0.002;
    const PULSE_SPEED_MAX = 0.006;

    // Глобальные функции для управления видимостью
    window.fadeOutMist = function(duration) {
        if (!duration) duration = 0.6;
        canvas.style.transition = 'opacity ' + duration + 's ease';
        canvas.style.opacity = '0';
    };

    window.fadeInMist = function(duration) {
        if (!duration) duration = 0.8;
        canvas.style.transition = 'opacity ' + duration + 's ease';
        canvas.style.opacity = '1';
    };

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function createParticles() {
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const radius = MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS);
            particles.push({
                x: Math.random() * (canvas.width + 400) - 200,
                y: Math.random() * (canvas.height + 400) - 200,
                radius: radius,
                baseRadius: radius,
                opacity: 0.03 + Math.random() * 0.06,
                pulseSpeed: PULSE_SPEED_MIN + Math.random() * (PULSE_SPEED_MAX - PULSE_SPEED_MIN),
                pulsePhase: Math.random() * Math.PI * 2,
                driftX: (Math.random() - 0.5) * DRIFT_SPEED,
                driftY: (Math.random() - 0.5) * DRIFT_SPEED,
            });
        }
    }

    function draw(timestamp) {
        if (!isVisible) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const time = timestamp || 0;

        for (const p of particles) {
            // Пульсация размера
            const pulse = Math.sin(time * p.pulseSpeed + p.pulsePhase);
            const currentRadius = p.baseRadius * (1 + pulse * 0.15);

            // Пульсация прозрачности
            const alpha = Math.max(0.01, Math.min(0.12, p.opacity * (1 + pulse * 0.3)));

            // Дрейф
            p.x += p.driftX;
            p.y += p.driftY;

            // Зацикливание с запасом
            const margin = MAX_RADIUS * 2;
            if (p.x < -margin) p.x = canvas.width + margin;
            if (p.x > canvas.width + margin) p.x = -margin;
            if (p.y < -margin) p.y = canvas.height + margin;
            if (p.y > canvas.height + margin) p.y = -margin;

            // Рисуем размытое пятно через радиальный градиент
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentRadius);
            gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
            gradient.addColorStop(0.3, `rgba(255, 255, 255, ${alpha * 0.6})`);
            gradient.addColorStop(0.6, `rgba(255, 255, 255, ${alpha * 0.2})`);
            gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);

            ctx.beginPath();
            ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        }

        animationId = requestAnimationFrame(draw);
    }

    function start() {
        resize();
        createParticles();
        if (animationId) cancelAnimationFrame(animationId);
        animationId = requestAnimationFrame(draw);
    }

    function stop() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }

    // Обработчики событий
    window.addEventListener('resize', () => {
        resize();
        createParticles();
    });

    // Пауза, когда вкладка неактивна
    document.addEventListener('visibilitychange', () => {
        isVisible = !document.hidden;
        if (isVisible) {
            animationId = requestAnimationFrame(draw);
        } else {
            stop();
        }
    });

    // Запуск
    start();

})();