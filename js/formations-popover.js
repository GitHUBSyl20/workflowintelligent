// Gestion des pop-overs pour les statistiques (page formations)
document.addEventListener('DOMContentLoaded', function() {
  const popovers = document.querySelectorAll('.stat-popover');

  popovers.forEach((popover) => {
    const wrapper = popover.closest('.stat-popover-wrapper');
    const content = wrapper ? wrapper.querySelector('.stat-popover-content') : null;

    if (!content) return;

    // Ouvrir/fermer au clic
    popover.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();

      // Fermer les autres pop-overs et retirer la classe active des wrappers
      popovers.forEach(p => {
        if (p !== popover) {
          p.classList.remove('active');
          const otherWrapper = p.closest('.stat-popover-wrapper');
          if (otherWrapper) {
            otherWrapper.classList.remove('wrapper-active');
            const otherContent = otherWrapper.querySelector('.stat-popover-content');
            if (otherContent) {
              otherContent.classList.remove('active');
            }
          }
        }
      });

      // Toggle le pop-over actuel
      const isActive = popover.classList.toggle('active');
      if (isActive) {
        content.classList.add('active');
        wrapper.classList.add('wrapper-active');
      } else {
        content.classList.remove('active');
        wrapper.classList.remove('wrapper-active');
      }
    });
  });

  // Fermer au clic en dehors
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.stat-popover-wrapper')) {
      popovers.forEach(p => {
        p.classList.remove('active');
        const wrapper = p.closest('.stat-popover-wrapper');
        if (wrapper) {
          wrapper.classList.remove('wrapper-active');
          const content = wrapper.querySelector('.stat-popover-content');
          if (content) content.classList.remove('active');
        }
      });
    }
  });

  // Fermer avec Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      popovers.forEach(p => {
        p.classList.remove('active');
        const wrapper = p.closest('.stat-popover-wrapper');
        if (wrapper) {
          wrapper.classList.remove('wrapper-active');
          const content = wrapper.querySelector('.stat-popover-content');
          if (content) content.classList.remove('active');
        }
      });
    }
  });
});
