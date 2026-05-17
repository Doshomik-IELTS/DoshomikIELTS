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

export interface ContentTag extends Struct.ComponentSchema {
  collectionName: 'components_content_tags';
  info: {
    description: 'Simple searchable content tag.';
    displayName: 'Tag';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ContentVocabularyItem extends Struct.ComponentSchema {
  collectionName: 'components_content_vocabulary_items';
  info: {
    description: 'Word, synonym, phrase, or collocation with optional Bangla support.';
    displayName: 'Vocabulary Item';
  };
  attributes: {
    antonyms: Schema.Attribute.Text;
    banglaExample: Schema.Attribute.Text;
    banglaMeaning: Schema.Attribute.Text;
    definition: Schema.Attribute.Text;
    exampleSentence: Schema.Attribute.Text;
    partOfSpeech: Schema.Attribute.Enumeration<
      [
        'noun',
        'verb',
        'adjective',
        'adverb',
        'phrase',
        'idiom',
        'collocation',
        'phrasal_verb',
        'other',
      ]
    >;
    pronunciation: Schema.Attribute.String;
    synonyms: Schema.Attribute.Text;
    term: Schema.Attribute.String & Schema.Attribute.Required;
    usageNote: Schema.Attribute.Text;
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
    acceptedAnswersText: Schema.Attribute.Text;
    canonicalAnswer: Schema.Attribute.String & Schema.Attribute.Required;
    explanation: Schema.Attribute.RichText;
    points: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<1>;
    scoringRule: Schema.Attribute.JSON;
    scoringRuleType: Schema.Attribute.Enumeration<
      ['exact', 'case_insensitive', 'contains', 'regex', 'manual_rubric']
    > &
      Schema.Attribute.DefaultTo<'case_insensitive'>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'content.example': ContentExample;
      'content.option': ContentOption;
      'content.tag': ContentTag;
      'content.vocabulary-item': ContentVocabularyItem;
      'tests.answer-key': TestsAnswerKey;
    }
  }
}
