# comics-app

## Insertion documentation

For the insertion we distinguished 3 cases of attributs:
1. The attribut is part of the table and we store it's value directly in the table (ex. TITLE for STORY)
2. The attribut is part of the table but is a foreign key to another table (ex.STORY_TYPE_ID for STORY)
3. The attribut is not part of the table, the value is stored in another table and there is a relation linking the 2 tables (ex.SCRIPT for STORY the relation is stored in the SCRIPT relation and the name of the artist is stored in the ARTIST TABLE)

### Case 1
