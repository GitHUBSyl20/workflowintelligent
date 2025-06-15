// Modal functionality
document.addEventListener('DOMContentLoaded', function() {
  // Skills Modal
  const openModalBtn = document.getElementById('open-modal-btn');
  const modal = document.getElementById('skillsModal');
  const closeBtn = document.querySelector('.modal-close');

  if (openModalBtn && modal) {
    openModalBtn.addEventListener('click', function(e) {
      e.preventDefault();
      modal.style.display = 'block';
      document.body.style.overflow = 'hidden';
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    });
  }

  // Make.com Modal
  const openMakeModalBtn = document.getElementById('open-make-modal-btn');
  const makeModal = document.getElementById('makeModal');
  const makeCloseBtn = makeModal.querySelector('.modal-close');

  if (openMakeModalBtn && makeModal) {
    openMakeModalBtn.addEventListener('click', function(e) {
      e.preventDefault();
      makeModal.style.display = 'block';
      document.body.style.overflow = 'hidden';
    });
  }

  if (makeCloseBtn) {
    makeCloseBtn.addEventListener('click', function() {
      makeModal.style.display = 'none';
      document.body.style.overflow = 'auto';
    });
  }

  // Close modals when clicking outside
  window.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
    if (e.target === makeModal) {
      makeModal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  });

  // Close modals with Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (modal.style.display === 'block') {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
      }
      if (makeModal.style.display === 'block') {
        makeModal.style.display = 'none';
        document.body.style.overflow = 'auto';
      }
    }
  });

  // Process Modal
  const openProcessModalBtn = document.getElementById('open-process-modal-btn');
  const processModal = document.getElementById('processModal');
  const processCloseBtn = processModal.querySelector('.modal-close');

  if (openProcessModalBtn && processModal) {
    openProcessModalBtn.addEventListener('click', function(e) {
      e.preventDefault();
      processModal.style.display = 'block';
      document.body.style.overflow = 'hidden'; // Prevent scrolling
    });
  }

  if (processCloseBtn) {
    processCloseBtn.addEventListener('click', function() {
      processModal.style.display = 'none';
      document.body.style.overflow = 'auto'; // Re-enable scrolling
    });
  }

  // Close process modal when clicking outside
  window.addEventListener('click', function(e) {
    if (e.target === processModal) {
      processModal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  });

  // Close process modal with Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && processModal.style.display === 'block') {
      processModal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  });
}); 