define(function (require, exports, module) {
  'use strict';

  var LanguageManager = brackets.getModule("language/LanguageManager"),
      CodeMirror = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror"),
      Editor = brackets.getModule("editor/Editor"),
      EditorManager = brackets.getModule("editor/EditorManager"),
      ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
      TokenUtils = brackets.getModule("utils/TokenUtils"),
      helperName = "",
      htmlLanguage = [];


  CodeMirror.defineMode("handlebars", function (config, parserConfig) {
    var lineNumber = 0;
    ExtensionUtils.addEmbeddedStyleSheet("span.cm-handlebars {background-color: rgba(126,126,126,0.23);}");

    var handlebarsOverlay = {
      startState: function () {
        return {
          inHandlebars: false,
          helperList: [],
        };
      },
      token: function (stream, state) {
        var ch;

        if (stream.match("{{")) {
          state.inHandlebars = false;
          stream.eatSpace();

          // Look if it's a valid handlebars expression
          if (stream.match(/^[\w\d\-\_\$\.\/\@ # ! " =]+\s*\}\}/, false)) {
            state.inHandlebars = true;
          }
          // In handlebars withou HTML escaping
          if (stream.match("{")) {
            state.inHandlebars = true;
            state.inNoEscape = true;
            return "property handlebars";
          }
          // Comments with {{}} in it
          if (stream.match(/^!--.+--\}\}/)) {
            return "comment handlebars";
          }
          // Comments regular
          if (stream.match(/^!.*\}\}/) && state.inHandlebars) {
            state.inHandlebars = false;
            return "comment handlebars";
          }

          if (state.inHandlebars) {
            return "property handlebars";
          } else {
            return "meta handlebars";
          }
        }
        if (stream.match(/^#/) && state.inHandlebars) {

          helperName = stream.match(/^[\w\d\-\_\$]+/, true);
          if (stream.match(/\s*\}\}/, false)) {
            return "meta handlebars";
          } else {
            state.helperList.push(helperName[0]);
            state.inHelper = true;
            return "keyword handlebars"
          }
        }
        if (stream.match(/^\//) && state.inHandlebars) {
          stream.backUp(3);
          if (stream.match(/^{{\//)) {
            helperName = stream.match(/^[\w\d\-\_\$]+/, true);
            if (helperName && state.helperList[state.helperList.length - 1] === helperName[0]) {

              state.helperList.pop();
              return "keyword";
            } else {
              return "meta";
            }
          } else {
            stream.next();
            stream.next();
            stream.next();
            return null;
          }
        }
        if (stream.match("}}")) {
          state.inHandlebars = false;
          state.inHelper = false;
          state.inNoEscape = false;
          return "property";
        }

        stream.next();
        return null;

      }
    }
    return CodeMirror.overlayMode(CodeMirror.getMode(config, parserConfig.backdrop || "text/html"), handlebarsOverlay);
  });

  htmlLanguage = LanguageManager.getLanguage("html");
  if (htmlLanguage !== null && !!htmlLanguage.removeFileExtension) { // Language.removeFileExtension was introduced in Sprint 38, github.com/adobe/brackets/issues/6873
    htmlLanguage.removeFileExtension("hbr");
    htmlLanguage.removeFileExtension("hbs");
    htmlLanguage.removeFileExtension("handlebars");
  }

  LanguageManager.defineLanguage("handlebars", {
    "name": "handlebars",
    "mode": "handlebars",
    "fileExtensions": ["hbr", "hbs", "handlebars"],
    "blockComment": ["{{!--", "--}}"]
  });

  function _handleEventOn(editor) {

  }


 /* $(EditorManager).on("activeEditorChange",
    function (event, current, previous) {
      if (previous && previous.getModeForDocument() === "handlebars") {

      }
      if (current.getModeForDocument() === "handlebars") {
        console.log(current);
        console.log(ExtensionUtils);

        var ctx = TokenUtils.getInitialContext(current._codeMirror, {line:0, ch: 0}),
            prevPos = {line: null, ch: null};
        while (prevPos.line !== ctx.pos.line || prevPos.ch !== ctx.pos.ch) {
          prevPos = {line: ctx.pos.line, ch: ctx.pos.ch}
          if (ctx.token.state.overlay.inHandlebars) {
            console.log("jere");
            ctx.editor.markText({line: ctx.pos.line, ch: ctx.token.start},
                                {line: ctx.pos.line, ch: ctx.token.end},
                                {className: "CodeMirror-matchingtag"});
          }
          TokenUtils.moveNextToken(ctx);
        }
        //console.log("console change and mode is: " + current.getModeForDocument());
        //console.log(current._codeMirror.getStateAfter());

      }
    }
  ); */



});
