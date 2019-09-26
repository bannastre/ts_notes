Feature: Content Notes

  Scenario Outline: I can create a new note
    And The right attributes for a new note
    When I call "POST" "/notes"
    Then I should get the expected status code <status>
    And The response should match the swagger at "./dist/definitions/nerd_notes.yaml"
    And The database should contain <nNotes> notes

    Examples:
      | status | nNotes |
      | 201    | 1          |


  Scenario Outline: I can get a list of notes
    Given The right attributes for a new note
    And I call "POST" "/notes"
    Then I should get the expected status code <postStatus>
    When I call "GET" "/notes"
    Then I should get the expected status code <status>
    And The response should match the swagger at "./definitions/nerd_notes.yaml"
    And The database should contain <nNotes> notes

    Examples:
      | postStatus | status | nNotes |
      | 201        | 200    | 1          |


  Scenario Outline: I can get a single note
    Given The right attributes for a new note
    And I call "POST" "/notes"
    And I remember the noteId
    When I call "GET" "/notes" with a <id>
    Then I should get the expected status code <status>
    And The response should match the swagger at "./definitions/nerd_notes.yaml"
    And The database should contain <nNotes> notes

    Examples:
      | status | nNotes | id         |
      | 200    | 1          | noteId |


  Scenario Outline: I can update the details of note
    Given The right attributes for a new note
    And I call "POST" "/notes"
    And I remember the noteId
    And The right atributes to update a note
    When I call "PATCH" "/notes" with a <id>
    Then I should get the expected status code <status>
    And The response should match the swagger at "./definitions/nerd_notes.yaml"
    And The database should contain <nNotes> notes

    Examples:
      | status | nNotes | id         |
      | 200    | 1          | noteId |


  Scenario Outline: I can delete the details of note
    Given The right attributes for a new note
    And I call "POST" "/notes"
    And I remember the noteId
    When I call "DELETE" "/notes" with a <id>
    Then I should get the expected status code <status>
    And The response should match the swagger at "./definitions/nerd_notes.yaml"
    And The database should contain <nNotes> notes

    Examples:
      | status | nNotes | id         |
      | 204    | 0          | noteId |


  Scenario Outline: I cannot get a single note if the noteID doesn't exist
    Given The right attributes for a new note
    And I call "POST" "/notes"
    When I call "GET" "/notes/A7B54747-5826-409E-BBF1-23EE5A69BED0"
    Then I should get the expected status code <status>
    And The response should match the swagger at "./definitions/nerd_notes.yaml"
    And The database should contain <nNotes> notes

    Examples:
      | status | nNotes |
      | 404    | 1          |


  Scenario Outline: I cannot create a new note without a Name attribute
    Given The wrong atributes for a new note
    When I call "POST" "/notes"
    Then I should get the expected status code <status>
    And The response should match the swagger at "./dist/definitions/nerd_notes.yaml"

    Examples:
      | status |
      | 400    |
