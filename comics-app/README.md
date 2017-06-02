# comics-app

## Insertion documentation

For the insertion we distinguished 3 cases of attributs:
1. The attribut is part of the table and we store it's value directly in the table (ex. TITLE for STORY)
2. The attribut is part of the table but is a foreign key to another table (ex.STORY_TYPE_ID for STORY)
3. The attribut is not part of the table, the value is stored in another table and there is a relation linking the 2 tables (ex.SCRIPT for STORY the relation is stored in the SCRIPT relation and the name of the artist is stored in the ARTIST TABLE)

When the webapp is lauched we create a dictionnary containing all the information needed for each table on how we must insert each of it's attribut.

### Case 1
For this type of attibut we store in the dictionnary the number of the case (1) and a boolean nullable indicating if the value can be nil.

### Case 2 
For this case, we must store in the dictionnary the name of the foreign table, the nullable boolean as indicated previously and we must also store a boolean to indicate if we can add a new element in the foreign table or if it is forbiden and the user must give an existing one. The rule to allow this is that the foreign table must have only a single attribut. 
Ex. When adding a story, if the user enters an stroy_type that is not in the database then the interface will automatically add the new stroy_type with the new name. If the user is inserting a new issue and gives a non existing country then it will not add anything because country has 2 attributes and must add the country separately. 
To identify sush elements the attribut must be named XXX_ID where XXX is the exact name of the foreign table.

### Case 3
For this case, the dictionnary must store as before the nullable boolean, it must store the name of the foreign table where the actual information is stored and it must store the name of the table of the relation. The structure of the relation must be the follwing:

XXXX:
TABLE1_ID
TABLE2_ID

With XXX the name of the relation, TABLE1 the exact name of the first table, TABLE2 is the exact name of the second table, table2 is the attribut of table one.
Ex. the script relation is the following : 

SCRIPT:
STORY_ID
ARTIST_ID 

The ARTIST element is an attribut of story so we put STORY as the first table

The dictionnary must also store a boolean saying if we are allowed to add a new element in the foreign table as for case 2.


##EXAMPLES:
### Case 1
'CHARACTER': {'NAME': {'case': 1, 'nullable': False}}
the name table has on attribut name of case 1 and it is not nullable.

### Case 2
'ISSUE': {...,'SERIE_ID': {'case': 2, 'foreign_table': 'SERIE', 'nullable': False, 'insert_foreign_table': False}, ...},
ISSUE has the attribut SERIE_ID of case 2, the foreign table associated is SERIE this is not nullable and we cann add a new SERIE automatically while adding a ISSUE

### Case 3
'ISSUE': {... 'EDITING': {'case': 3, 'foreign_table': 'EDITOR', 'foreign_relation': 'ISSUE_EDITING', 'nullable': True, 'insert_foreign_table': True},...},

ISSUE has the attribut EDITING which is case 3 the foreign table where is stored the name of the edit is EDITOR, the foreign relation where the actual relation is stored is ISSUE_EDITING, the element is nullable and we can insert a new editor automatically when adding a new ISSUE.
