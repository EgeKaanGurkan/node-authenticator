
function validate() {
    let usernameField = document.getElementById("username").value;
    let passwordField = document.getElementById("password").value;
    let authCodeField = document.getElementById("authCode").value;

    let usernameBase64 = btoa(usernameField);
    let authAndPassword = btoa(authCodeField + ":" + passwordField);

    var xhr = new XMLHttpRequest();
    xhr.timeout = 2000;
    xhr.open("POST", "http://localhost:60000/auth", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
        username: usernameBase64,
        password: authAndPassword
    }));

    xhr.onload = function() {
        var data = JSON.parse(this.responseText)
        if (data.status === "ERROR") {
            alert(data.message)
        } else {console.log(data)
            if (data.authenticated === true) {
                alert("Authenticated!")
            } else {
                alert("Wrong code!")
            }
        }
    }

    xhr.timeout = function(e) {
        alert("Timed out");
    }

}