--Print the brand group names with the highest number of Belgian indicia publishers:
SELECT B.name
FROM Brand_Group B, Publisher P, Indicia_Publisher I, Country C
WHERE B.publisher_id = P.id AND
      P.id = I.publisher_id AND
      I.country_id = C.id AND
      C.name = 'Belgium'
GROUP BY B.id, B.name
ORDER BY COUNT(*) DESC
FETCH FIRST ROW ONLY
;

--Print the ids and names of publishers of Danish book series:
SELECT DISTINCT P.id, P.name
FROM Serie S, Publisher P, Publication_Type PT, Country C
WHERE S.publisher_id = P.id AND
      S.country_id = C.id AND
      C.name = 'Denmark' AND
      S.publication_type_id = PT.id AND
      PT.name = 'book'
;

--Print the names of all Swiss series that have been published in magazines:
SELECT S.name
FROM Serie S, Country C, Publication_Type T
WHERE S.country_id = C.id AND
	C.name = 'Switzerland' AND
	S.publication_type_id = T.id AND
	T.name = 'magazine'
;

--Starting from 1990, print the number of issues published each year:
SELECT I.publication_date, COUNT(*) as NUMBER_OF_ISSUES
FROM Issue I
WHERE I.publication_date >= '1990'
GROUP BY I.publication_date
ORDER BY I.publication_date ASC
;

--Print the number of series for each indicia publisher whose name resembles ‘DC comics’:
SELECT IP.name, COUNT(*)
FROM Indicia_Publisher IP, Serie S, Publisher P
WHERE IP.name LIKE ('%DC Comics%') AND
	IP.publisher_id = P.id AND
	S.publisher_id = P.id
GROUP BY IP.name
;

--Print the titles of the 10 most reprinted stories:
SELECT S.title
FROM Story_Reprint SR, Story S
WHERE S.id = SR.origin_id
GROUP BY S.id, S.title
ORDER BY COUNT(*) DESC
FETCH FIRST 10 ROWS ONLY
;

--Print the artists that have scripted, drawn, and colored at least one of the stories they were involved in:
SELECT DISTINCT A.name
FROM Artist A
WHERE A.id IN (SELECT S.artist_id
                  FROM Script S, Pencil P, Color C
		      WHERE S.artist_id = P.artist_id AND
                  P.artist_id = C.artist_id AND
                  P.story_id = C.story_id AND
                  P.story_id = S.story_id)
;

--Print all non-reprinted stories involving Batman as a non-featured character:
SELECT S.title
FROM Story S
WHERE NOT EXISTS (SELECT SR.origin_id
                  FROM Story_Reprint SR
                  WHERE SR.origin_id = S.id
                  )
      AND
      EXISTS (SELECT SC.story_id
                  FROM Story_Character SC, Character C
                  WHERE SC.story_id = S.id AND
                  SC.character_id = C.id AND
	            C.name = 'Batman')
      AND
      NOT EXISTS (SELECT SF.story_id
                  FROM Story_Feature SF, Character C
                  WHERE SF.story_id = S.id AND
                  SF.character_id = C.id AND
		      C.name = 'Batman')
