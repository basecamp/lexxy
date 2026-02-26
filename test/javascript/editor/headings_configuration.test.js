import { expect, test } from "vitest";
import { createElement } from "../helpers/dom_helper";
import EditorConfiguration from "../../../src/editor/configuration";
import { configure } from "../../../src/index";

configure({
  default: {
    headings: ["h1", "h2", "h3", "h4", "h5", "h6"]
  },
});

test("uses default headings", () => {
  const element = createElement("<lexxy-editor></lexxy-editor>");
  const config = new EditorConfiguration(element);
  expect(config.get("headings")).toEqual(["h1", "h2", "h3", "h4", "h5", "h6"]);
});

test("overrides headings with attribute", () => {
  const element = createElement(
    '<lexxy-editor headings=\'["h1", "h2", "h3", "h4", "h5", "h6"]\'></lexxy-editor>',
  );
  const config = new EditorConfiguration(element);
  expect(config.get("headings")).toEqual(["h1", "h2", "h3", "h4", "h5", "h6"]);
});

test("overrides headings with preset", () => {
  configure({
    blog: {
      headings: ["h1", "h2", "h3", "h4", "h5", "h6"],
    },
  });

  const element = createElement("<lexxy-editor preset='blog'></lexxy-editor>");
  const config = new EditorConfiguration(element);
  expect(config.get("headings")).toEqual(["h1", "h2", "h3", "h4", "h5", "h6"]);
});

test("restricts headings to a subset", () => {
  configure({
    minimal: {
      headings: ["h2"],
    },
  });

  const element = createElement(
    "<lexxy-editor preset='minimal'></lexxy-editor>",
  );
  const config = new EditorConfiguration(element);
  expect(config.get("headings")).toEqual(["h2"]);
});
