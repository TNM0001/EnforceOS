let lib;

export default {
  name: "Loading Screen",
  description:
    "Displays a graphical loader while the bootloader is loading other content",
  ver: 1,
  type: "library",
  init: function (l) {
    lib = l;
  },
  data: {
    loader: function () {
      const x = new lib.html("div")
        .html(
          '<div class="logo">EnforceOS<span class="small-label superscript">indev</span></div><span>loading...</span>'
        )
        .class("loading-screen")
        .appendTo("body");

      return x;
    },
  },
};
