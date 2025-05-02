function deleteNote(noteId: number) {
    fetch("/delete-note", {
        method: "POST",
        body: JSON.stringify({ noteId: noteId }),
          headers: { "Content-Type": "application/json" },
    }).then((_res) => {
        window.location.href="/notes";
    });
}

function deleteCipherHex(noteId: number) {
    fetch("/delete-cipher-hex", {
        method: "POST",
        body: JSON.stringify({ noteId: noteId }),
          headers: { "Content-Type": "application/json" },
    }).then((_res) => {
        window.location.href="/";
    });
}
