"use strict";
const page = () => {
    return (
        <column id="container">
            <text id={"text"} style={{fontSize: 50}}>Hello，Tiny UI!</text>
        </column>
    );
}

TinyUI.render(page());

