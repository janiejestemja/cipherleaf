function toggleNavbar() {
    var navLinks = document.getElementById("navLinks");
    navLinks.classList.toggle("nav-open");
}
function deleteNote(noteId) {
    fetch("/delete-note", {
        method: "POST",
        body: JSON.stringify({ noteId: noteId }),
        headers: { "Content-Type": "application/json" },
    }).then(function (_res) {
        window.location.href = "/notes";
    });
}
function deleteCipherHex(noteId) {
    fetch("/delete-cipher-hex", {
        method: "POST",
        body: JSON.stringify({ noteId: noteId }),
        headers: { "Content-Type": "application/json" },
    }).then(function (_res) {
        window.location.href = "/";
    });
}
