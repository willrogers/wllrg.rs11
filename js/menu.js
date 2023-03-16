/* Javascript for the hamburger menu. */
var checkbox = document.querySelector("#toggle-menu");
console.log(checkbox);
var background = document.querySelector("body");
console.log(background);
background.addEventListener("click", hideMenu, false);
var ham = document.querySelector("#toggle-label");
ham.addEventListener("click", showMenu, true);
function hideMenu(e) {
    if (e.target.id !== "toggle-menu") {
        if (checkbox.checked === false) {
            checkbox.checked = true;
        }
    }
    document.body.style.overflow = "auto";
}
function showMenu(e) {
    if (checkbox.checked === true) {
        checkbox.checked = false;
    }
    e.stopPropagation();
    document.body.style.overflow = "hidden";
}
