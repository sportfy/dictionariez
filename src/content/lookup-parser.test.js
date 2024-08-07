import { parseHTML } from "./lookup-parser.js";

describe("lookup-parser", () => {
  it("should return an empty object for empty input", () => {
    const result = parseHTML("", {});
    chai.expect(result).to.deep.equal({});
  });

  it("should parse HTML and extract the headword", () => {
    const htmlString = `
      <div>
        <div class="hd_area">
          <div id="headword">Test Word</div>
        </div>
      </div>
    `;
    const parserDesc = {
      w: {
        selector: ".hd_area #headword",
      },
    };
    const $html = $(htmlString);
    const result = parseHTML($html, parserDesc);
    expect(result).to.deep.equal({ w: "Test Word" });
  });

  it("should parse HTML and extract the pronunciations", () => {
    const htmlString = `
    <div>
      <div class="hd_area">
        <div class="hd_prUS">/test/</div>
        <div class="hd_tf"><a href="https://testaudio1.mp3"></a></div>
        <div class="hd_pr">/testUK/</div>
        <div class="hd_tf"><a href="https://testaudio2.mp3"></a></div>
        <div class="hd_p1_1">tést</div>
      </div>
    </div>
  `;
    const parserDesc = {
      prons: [
        {
          symbol: {
            selector: ".hd_area .hd_prUS",
          },
          audio: {
            selector: ".hd_area .hd_prUS + .hd_tf",
            htmlRegex: "https:.*?\\.mp3",
          },
          type: "ame",
        },
        {
          symbol: {
            selector: ".hd_area .hd_pr",
          },
          audio: {
            selector: ".hd_area .hd_pr + .hd_tf",
            htmlRegex: "https:.*?\\.mp3",
          },
          type: "bre",
        },
        {
          symbol: {
            selector: ".hd_area .hd_p1_1",
          },
          type: "pinyin",
        },
      ],
    };
    const $html = $(htmlString);
    const result = parseHTML($html, parserDesc);
    expect(result).to.deep.equal({
      prons: [
        {
          symbol: "/test/",
          audio: "https://testaudio1.mp3",
          type: "ame",
        },
        {
          symbol: "/testUK/",
          audio: "https://testaudio2.mp3",
          type: "bre",
        },
        {
          symbol: "tést",
          type: "pinyin",
        },
      ],
    });
  });

  it("should parse HTML and extract the definitions", () => {
    const htmlString = `
    <div>
    <table id="homoid">
      <tr class="def_row">
        <td class="pos">noun</td>
        <td class="def_fl">
          <div class="de_li1">Definition 1</div>
          <div class="de_li1">Definition 2</div>
        </td>
      </tr>
      <tr class="def_row">
        <td class="pos">verb</td>
        <td class="def_fl">
          <div class="de_li1">Definition 3</div>
        </td>
      </tr>
    </table>
    </div>
  `;
    const parserDesc = {
      defs: {
        groups: "#homoid tr.def_row",
        result: {
          pos: {
            selector: ".pos",
          },
          def: {
            selector: ".def_fl>.de_li1",
            toArray: true,
          },
        },
      },
    };
    const $html = $(htmlString);
    const result = parseHTML($html, parserDesc);
    expect(result).to.deep.equal({
      defs: [
        {
          pos: "noun",
          def: ["Definition 1", "Definition 2"],
        },
        {
          pos: "verb",
          def: ["Definition 3"],
        },
      ],
    });
  });

  it("should parse HTML and extract the pronunciations using htmlRegex", () => {
    const htmlString = `
    <div>
      <div class="vmod" data-topic="test" data-hveid="testid">
        <span>Test Pronunciation</span>
      </div>
    </div>
  `;
    const parserDesc = {
      prons: [
        {
          symbol: {
            selector: ".vmod[data-topic][data-hveid]",
            htmlRegex: "<span>([^<>]*)</span>",
            regexIndex: 1,
          },
          type: "unknow",
        },
      ],
    };
    const $html = $(htmlString);
    const result = parseHTML($html, parserDesc);
    expect(result).to.deep.equal({
      prons: [
        {
          symbol: "Test Pronunciation",
          type: "unknow",
        },
      ],
    });
  });

  it("should parse HTML and extract the definitions with array", () => {
    const htmlString = `
    <div>
      <div class="vmod">
        <div class="vmod" data-topic="test">
          <i>noun</i>
          <div data-dobid="dfn">Definition 1</div>
          <div data-dobid="dfn">Definition 2</div>
        </div>
      </div>
    </div>
  `;
    const parserDesc = {
      defs: {
        groups: ".vmod>.vmod[data-topic]",
        result: {
          pos: {
            selector: "i",
          },
          def: {
            selector: "[data-dobid='dfn']",
            toArray: true,
          },
        },
      },
    };
    const $html = $(htmlString);
    const result = parseHTML($html, parserDesc);
    expect(result).to.deep.equal({
      defs: [
        {
          pos: "noun",
          def: ["Definition 1", "Definition 2"],
        },
      ],
    });
  });

  it("should parse HTML and extract the definitions with max array", () => {
    const htmlString = `
    <div>
      <div data-tae>
        <div data-mh='-1'>
          <div>verb</div>
          <ol>
            <li>Definition 1</li>
            <li>Definition 2</li>
            <li>Definition 3</li>
          </ol>
        </div>
      </div>
    </div>
  `;
    const parserDesc = {
      defs2: {
        groups: "[data-tae]>[data-mh='-1']",
        result: {
          pos: {
            selector: "div",
          },
          def: {
            selector: "ol>li",
            max: 2,
            toArray: true,
          },
        },
      },
    };
    const $html = $(htmlString);
    const result = parseHTML($html, parserDesc);
    expect(result).to.deep.equal({
      defs2: [
        {
          pos: "verb",
          def: ["Definition 1", "Definition 2"],
        },
      ],
    });
  });
});
