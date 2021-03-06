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
          // In handlebars without HTML escaping
          if (stream.match("{")) {
            state.inHandlebars = true;
            state.inNoEscape = true;
            return "def handlebars";
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
            return "def handlebars"; // Return def for {{
          } else {
            return "meta handlebars"; //If there is {{ but not a valid handlebars return meta
          }
        }

        //Built-in handlebars helpers
        if (stream.match(/^#/) && state.inHandlebars) {
          helperName = stream.match(/^[\w\d\-\_\$]+/, true);
          //Missing argument for helper return error
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
              return "keyword handlebars";
            } else {
              return "meta handlebars";
            }
            //When there is a {{./foo}} or {{this/foo}}
          } else {
            stream.next();
            stream.next();
            stream.next();
            return null;
          }
        }
        if (stream.match(/\s*[\w\d\-\_\$]+\s*/) && state.inHandlebars)  {
          if (state.inVariable) {
            return "property handlebars"
          }
          state.inVariable = true;
          return "variable-2 handlebars";
        }
        if (stream.match(/\./) && state.inHandlebars && state.inVariable) {
            return "handlebars"
          }
        //if (stream.match(/[\s \.]+/) && state.inHandlebars) {
          //console.log("here");
          //return "handlebars";
        //}
        if (stream.match("}}") && state.inHandlebars) {
          state.inHandlebars = false;
          state.inHelper = false;
          state.inNoEscape = false;
          state.inVariable = false;
          return "def handlebars";
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


});
