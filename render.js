const { ipcRenderer } = require('electron');

const $ = require('jquery');
require('bootstrap');
require('popper.js');

$(function(){
  $.get({
    url: "./pages/connect.html",
    dataType: "html"
  }).done((data) => {
    $("body").append(data);
  }).fail((req, status, err) => {
    ipcRenderer.send("error", {status: status, err: err});
  });
});