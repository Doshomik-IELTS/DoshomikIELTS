import type { Schema, Struct } from '@strapi/strapi';

export interface ContentExample extends Struct.ComponentSchema {
  collectionName: 'components_content_examples';
  info: {
    description: 'Labelled learner-facing example.';
    displayName: 'Example';
  };
  attributes: {
    label: Schema.Attribute.String;
    text: Schema.Attribute.Text & Schema.Attribute.Required;
  };
}

export interface ContentOption extends Struct.ComponentSchema {
  collectionName: 'components_content_options';
  info: {
    description: 'Question or matching option.';
    displayName: 'Option';
  };
  attributes: {
    label: Schema.Attribute.String;
    text: Schema.Attribute.Text & Schema.Attribute.Required;
    value: Schema.Attribute.String;
  };
}

export interface TestsAnswerKey extends Struct.ComponentSchema {
  collectionName: 'components_tests_answer_keys';
  info: {
    description: 'Correct answer and scoring metadata.';
    displayName: 'Answer Key';
  };
  attributes: {
    acceptedAnswers: Schema.Attribute.JSON;
    canonicalAnswer: Schema.Attribute.String & Schema.Attribute.Required;
    explanation: Schema.Attribute.RichText;
    scoringRule: Schema.Attribute.JSON;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'content.example': ContentExample;
      'content.option': ContentOption;
      'tests.answer-key': TestsAnswerKey;
    }
  }
}
