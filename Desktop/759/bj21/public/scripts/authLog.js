(function() {
    checkCookie();
})();

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "; expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + expires + "; path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function checkCookie() {
    var cname = getCookie("cname");
    if (cname !== "") {
        console.log("..");
    } else {
        cname = "bljk21";
        if (cname !== "" && cname != null) {
            setCookie("cname", cname, 10);
        }
   }
}

function eraseCookie(name) {
    createCookie(name,"",-1);
}

var myInput = document.getElementById("password");
var letter = document.getElementById("letter");
var capital = document.getElementById("capital");
var number = document.getElementById("number");
var length = document.getElementById("length");

// When the user clicks on the password field, show the message box
if(myInput){
myInput.onfocus = function() {
    document.getElementById("message").style.display = "block";
}

// When the user clicks outside of the password field, hide the message box
myInput.onblur = function() {
    document.getElementById("message").style.display = "none";
}

// When the user starts to type something inside the password field
myInput.onkeyup = function() {
    // Validate lowercase letters
    var lowerCaseLetters = /[a-z]/g;
    if(myInput.value.match(lowerCaseLetters)) {
        letter.classList.remove("invalid");
        letter.classList.add("valid");
    } else {
        letter.classList.remove("valid");
        letter.classList.add("invalid");
    }

    // Validate capital letters
    var upperCaseLetters = /[A-Z]/g;
    if(myInput.value.match(upperCaseLetters)) {
        capital.classList.remove("invalid");
        capital.classList.add("valid");
    } else {
        capital.classList.remove("valid");
        capital.classList.add("invalid");
    }

    // Validate numbers
    var numbers = /[0-9]/g;
    if(myInput.value.match(numbers)) {
        number.classList.remove("invalid");
        number.classList.add("valid");
    } else {
        number.classList.remove("valid");
        number.classList.add("invalid");
    }

    // Validate length
    if(myInput.value.length >= 6) {
        length.classList.remove("invalid");
        length.classList.add("valid");
    } else {
        length.classList.remove("valid");
        length.classList.add("invalid");
    }
    }
}

$("#loginBtn").on("click",(e)=>{
    e.preventDefault();
    if(isValid()){
        displayErr('');
        login();
    }
});

$("#signupBtn").on("click",(e)=>{
    e.preventDefault();
    if(isValid()){
        displayErr('');
        signup();
    }
});


function isValid(login = true) {
    if (!login) {

    } else {
        if ($("#username").val() === '') return displayErr('Please enter username.');
        if ($("#password").val() === '') return displayErr('Please enter password.');
    }
    //If checks pass, return true to indicate valid
    return true;
}

function displayErr(msg) {
    $('#err-msg').text(msg);
}


function login() {
    $.ajax({
        type: 'post',
        url: '/api/login',
        data: $('form#login-form').serialize(),
        dataType: 'json',
        statusCode: {
            500: function (data) {
                if (data.responseJSON && data.responseJSON.error) {
                    return displayErr(data.responseJSON.error)
                }
                displayErr('Login failed. Unknown error.');
            },
            200: function () {
                window.location.replace('lobby');
            }
        }
    });
}
function signup() {
    $.ajax({
        type: 'post',
        url: '/api/signup',
        data: $('form#signup-form').serialize(),
        dataType: 'json',
        statusCode: {
            500: function (data) {
                if (data.responseJSON && data.responseJSON.error) {
                    return displayErr(data.responseJSON.error)
                }
                console.log(data);
                displayErr('Sign up failed. Unknown error.');
            },
            200: function () {
                window.location.replace('/');
            }
        }
    });
}

function getUsername(email) {
    let index = email.indexOf("@");
    return email.substring(0,index);
}
