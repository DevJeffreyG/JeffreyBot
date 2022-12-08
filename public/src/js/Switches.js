function switchWork() {
    var switches = document.querySelectorAll(".switch");

    for(const Switch of switches) {
        console.log("WORKING")
        Switch.addEventListener("click", () => {
            console.log("click")
            Switch.classList.toggle("active");
        })
    }
}

switchWork()