document.addEventListener('DOMContentLoaded', function () {
    const swiper = new Swiper('.mySwiper', {
        // Optional parameters
        loop: true,
        grabCursor: true,
        centeredSlides: true, // Center the active slide
        slidesPerView: 'auto', // Adjust based on how many slides you want visible partially on sides
        spaceBetween: 30, // Add some space between slides
        // effect: 'coverflow', // Using coverflow for a nice effect that works well with scaling
        // coverflowEffect: {
        //     rotate: 30, // Slide rotate in degrees
        //     stretch: 0, // Stretch space between slides (in px)
        //     depth: 100, // Depth offset in px (slides translate in Z axis)
        //     modifier: 1, // Effect multipler
        //     slideShadows: true, // Enables slides shadows
        // },

        // Using a more straightforward effect like 'slide' and managing scaling manually can also work.
        // If not using coverflow, you might need to manually adjust margins or transforms.

        // Navigation arrows
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },

        // Pagination
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },

        on: {
            init: function () {
                // On initialization, Swiper automatically adds swiper-slide-active to the centered slide.
                // The CSS already handles the sizing for .swiper-slide-active.
                // console.log('Swiper initialized');
            },
            slideChangeTransitionStart: function () {
                // When slide change starts, all slides reset to default size by removing swiper-slide-active
                // then swiper-slide-active is added to the new active slide.
                // CSS transitions will handle the animation.
                // console.log('Slide change transition start');
            },
            slideChangeTransitionEnd: function () {
                // console.log('Slide change transition end');
            }
        }
    });
});
