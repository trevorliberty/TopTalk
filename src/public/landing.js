const redirect = () => {
    let userName = document.getElementById('username').value;
    window.location.href = `main?screenname=${userName}`
}