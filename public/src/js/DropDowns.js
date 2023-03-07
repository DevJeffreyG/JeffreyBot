window.document.addEventListener("click", (click) => {
    var actives = document.querySelectorAll(".active");
    actives = Array.from(actives).filter(x => {
        if (!(x.classList.contains("announcer") || x.classList.contains("switch") || x.nodeName === "A" || x.classList.contains("reveal")))
            return x
    });

    let filter = click.target.closest(".role-drop") || click.target.closest(".channel-drop") || click.target.closest(".category-drop") ||
        click.target.closest(".session-manager") ||
        !click.target.parentNode || !click.target.parentNode?.parentNode;

    if (!filter) {
        actives.forEach(x => x.classList.remove("active"))

        const arrow = document.querySelector("span#arrow");
        arrow.innerText = "arrow_drop_down";
    }
})