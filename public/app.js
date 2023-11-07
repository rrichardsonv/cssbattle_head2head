class App {
  constructor () {
    this.bindCopyButton();
  }

  bindCopyButton () {
    const copyButtons = document.querySelectorAll("[data-copy-to-clipboard]");
    if (copyButtons && copyButtons.length) {
      copyButtons.forEach((btn) =>
        btn.addEventListener("click", function (e) {
          e.preventDefault();
          const copyText = document.getElementById(btn.dataset.target);

          document.execCommand("copy", false, copyText.select());
        }),
      );
    }
  }
}

window.app = new App();