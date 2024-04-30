/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { addHelpers, formatBlockErrorMessage } from "./response-helpers";
import { expect, use } from "chai";
import { restore } from "sinon";
import * as sinonChai from "sinon-chai";
import {
  BlockReason,
  Content,
  FinishReason,
  GenerateContentResponse,
} from "../../types";

use(sinonChai);

const fakeResponseText: GenerateContentResponse = {
  candidates: [
    {
      index: 0,
      content: {
        role: "model",
        parts: [{ text: "Some text" }, { text: " and some more text" }],
      },
    },
  ],
};
const fakeResponseFunctionCall: GenerateContentResponse = {
  candidates: [
    {
      index: 0,
      content: {
        role: "model",
        parts: [
          {
            functionCall: {
              name: "find_theaters",
              args: {
                location: "Mountain View, CA",
                movie: "Barbie",
              },
            },
          },
        ],
      },
    },
  ],
};

const badFakeResponse: GenerateContentResponse = {
  promptFeedback: {
    blockReason: BlockReason.SAFETY,
    safetyRatings: [],
  },
};

describe("response-helpers methods", () => {
  afterEach(() => {
    restore();
  });
  describe("addHelpers", () => {
    it("good response text", async () => {
      const enhancedResponse = addHelpers(fakeResponseText);
      expect(enhancedResponse.text()).to.equal("Some text and some more text");
    });
    it("good response functionCall", async () => {
      const enhancedResponse = addHelpers(fakeResponseFunctionCall);
      expect(enhancedResponse.functionCall()).to.deep.equal(
        fakeResponseFunctionCall.candidates[0].content.parts[0].functionCall,
      );
    });
    it("bad response safety", async () => {
      const enhancedResponse = addHelpers(badFakeResponse);
      expect(enhancedResponse.text).to.throw("SAFETY");
    });
  });
  describe("getBlockString", () => {
    it("has no promptFeedback or bad finishReason", async () => {
      const message = formatBlockErrorMessage({
        candidates: [
          {
            index: 0,
            finishReason: FinishReason.STOP,
            finishMessage: "this was fine",
            content: {} as Content,
          },
        ],
      });
      expect(message).to.equal("");
    });
    it("has promptFeedback and blockReason only", async () => {
      const message = formatBlockErrorMessage({
        promptFeedback: {
          blockReason: BlockReason.SAFETY,
          safetyRatings: [],
        },
      });
      expect(message).to.include("Response was blocked due to SAFETY");
    });
    it("has promptFeedback with blockReason and blockMessage", async () => {
      const message = formatBlockErrorMessage({
        promptFeedback: {
          blockReason: BlockReason.SAFETY,
          blockReasonMessage: "safety reasons",
          safetyRatings: [],
        },
      });
      expect(message).to.include(
        "Response was blocked due to SAFETY: safety reasons",
      );
    });
    it("has bad finishReason only", async () => {
      const message = formatBlockErrorMessage({
        candidates: [
          {
            index: 0,
            finishReason: FinishReason.SAFETY,
            content: {} as Content,
          },
        ],
      });
      expect(message).to.include("Candidate was blocked due to SAFETY");
    });
    it("has finishReason and finishMessage", async () => {
      const message = formatBlockErrorMessage({
        candidates: [
          {
            index: 0,
            finishReason: FinishReason.SAFETY,
            finishMessage: "unsafe candidate",
            content: {} as Content,
          },
        ],
      });
      expect(message).to.include(
        "Candidate was blocked due to SAFETY: unsafe candidate",
      );
    });
  });
});
