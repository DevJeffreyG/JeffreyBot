function switchWork() {
    var switches = document.querySelectorAll(".switch");

    for (const Switch of switches) {
        Switch.addEventListener("click", () => {
            console.log("click")
            Switch.classList.toggle("active");
        })
    }
}

switchWork()