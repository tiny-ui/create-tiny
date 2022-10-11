const isTiny = typeof TinyUI !== "undefined"

if (isTiny) {
    console.log('tiny')
    var app = () => {
        return TinyUI.createElement("column", {
            style: {
                width: "100%",
                height: "100%",
            }
        }, TinyUI.createElement("text", {style: {fontSize: 80}}, "hello world@"));
    };

    TinyUI.render(app());
} else {
    console.log('web')
    const header = document.createElement("h1");

    header.innerHTML = "Hello world!";

    document.body.appendChild(header);
}
