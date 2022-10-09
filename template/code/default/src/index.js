"use strict";

var app = () => {
    return TinyDOM.createElement("column", {
        style: {
            width: "100%",
            height: "100%",
        }
    }, TinyDOM.createElement("text", {}, "hello word"));
};

TinyUI.render(app());
