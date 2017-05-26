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
;

--Print the series names that have the highest number of issues which contain a story whose type (e.g., cartoon) is not the one occurring most frequently in the database (e.g, illustration):
SELECT SE.name
FROM Serie SE
WHERE SE.id =
	(SELECT I.serie_id
		FROM Issue I
		WHERE EXISTS
			(SELECT ST.id
				FROM Story ST
				WHERE I.id = ST.issue_id AND
						ST.story_type_id !=
							(SELECT S.story_type_id
								FROM Story S
								GROUP BY S.story_type_id
								ORDER BY COUNT(*) DESC
								FETCH FIRST ROW ONLY
							)
			)
		GROUP BY I.serie_id
		ORDER BY COUNT(*) DESC
		FETCH FIRST ROW ONLY
	)
;

--Print the names of publishers who have series with all series types:
SELECT P.name
FROM Publisher P, Serie S
WHERE S.publisher_id = P.id
GROUP BY P.id, P.name
HAVING COUNT(DISTINCT S.publication_type_id) = (SELECT COUNT(*) FROM Publication_Type)
;

--Print the 10 most-reprinted characters from Alan Moore's stories:
SELECT C.name, COUNT(*)
FROM Story_Reprint SR, Story S, Story_Character SC, Script SCR, Artist A, Character C
WHERE S.id = SR.origin_id AND
		S.id = SC.story_id AND
        SC.character_id = C.id AND
		S.id = SCR.story_id AND
		SCR.artist_id = A.id AND
		A.name = 'Alan Moore'
GROUP BY SR.origin_id, C.name
ORDER BY COUNT(SR.target_id) DESC
FETCH FIRST 10 ROWS ONLY
;


--Print the writers of nature-related stories that have also done the pencilwork in all their nature-related stories:
SELECT SCR.artist_id
FROM Story S, Script SCR, Pencil P
WHERE S.id = SCR.story_id AND
		S.id = P.story_id AND
		SCR.artist_id = P.artist_id AND
		S.genre LIKE '%nature%'
GROUP BY SCR.artist_id
HAVING COUNT(S.id) = (SELECT COUNT(*)
						FROM Story, Script
						WHERE Story.id = Script.story_id AND
                  				Script.artist_id = SCR.artist_id AND
								Story.genre LIKE '%nature%'
						)
;

--For each of the top-10 publishers in terms of published series, print the 3 most popular languages of their series:
SELECT P.name AS publisher_name, L.name AS language_name, K.language_count
FROM Publisher P, Language L,
	(SELECT T.publisher_id, T.language_id, T.language_count, ROW_NUMBER()
	OVER (PARTITION BY T.publisher_id ORDER BY T.language_count DESC) AS rn
	FROM
		(SELECT S.publisher_id, S.language_id, COUNT(*) AS language_count
		FROM Serie S
		WHERE S.publisher_id IN
			(SELECT S2.publisher_id
			FROM Serie S2
			GROUP BY S2.publisher_id
			ORDER BY COUNT(*) DESC
			FETCH FIRST 10 ROWS ONLY)
		GROUP BY S.publisher_id, S.language_id
		ORDER BY COUNT(*) DESC) T
	) K
WHERE P.id = K.publisher_id AND
      L.id = K.language_id AND
      K.rn <= 3
ORDER BY publisher_name, language_count DESC
;

--Print the languages that have more than 10000 original stories published in magazines, along with the number of those stories:
SELECT L.name, COUNT(*) AS story_count
FROM Story S, Issue I, Serie SE, Publication_Type PT, Language L
WHERE S.issue_id = I.id AND
		I.serie_id = SE.id AND
		L.id = SE.language_id AND
		S.id NOT IN (SELECT SR.target_id FROM Story_Reprint SR) AND
		SE.publication_type_id = PT.id AND
		PT.name = 'magazine'
GROUP BY L.name, SE.language_id
HAVING COUNT(*) >= 10000
ORDER BY COUNT(*) DESC
;

--Print all story types that have not been published as a part of Italian magazine series.:
SELECT ST.name
FROM STORY_TYPE ST
MINUS
SELECT DISTINCT ST.name
FROM STORY_TYPE ST,STORY S,ISSUE I,SERIE SER,PUBLICATION_TYPE PT,COUNTRY C
WHERE C.name  = 'Italy'
AND SER.COUNTRY_ID = C.ID
AND SER.PUBLICATION_TYPE_ID = PT.ID
AND PT.name = 'magazine'
AND SER.ID = I.SERIE_ID
AND S.ISSUE_ID = I.ID
AND S.STORY_TYPE_ID = ST.ID
;

--Print the writers of cartoon stories who have worked as writers for more than one indicia publisher.:
SELECT A.name
FROM ARTIST A, SCRIPT SCR,INDICIA_PUBLISHER IP,ISSUE I,STORY S,STORY_TYPE ST
WHERE A.ID = SCR.ARTIST_ID
AND SCR.STORY_ID = S.ID
AND S.ISSUE_ID = I.ID
AND I.INDICIA_PUBLISHER_ID = IP.ID
AND ST.NAME = 'cartoon'
AND ST.ID = S.STORY_TYPE_ID
GROUP BY A.name
HAVING COUNT(DISTINCT INDICIA_PUBLISHER_ID) > 1
;

--Print the 10 brand groups with the highest number of indicia publishers.:
SELECT BG.NAME,COUNT(*)
FROM BRAND_GROUP BG,PUBLISHER P, INDICIA_PUBLISHER IP
WHERE BG.PUBLISHER_ID = P.id
AND IP.PUBLISHER_ID = P.ID
GROUP BY BG.NAME
ORDER BY COUNT(*) DESC
FETCH FIRST 10 ROWS ONLY
;

--Print the average series length (in terms of years) per indicia publisher.:
SELECT name,AVG(len)
FROM(
    SELECT IP.name AS name, S.YEAR_ENDED-S.YEAR_BEGAN as len
    FROM INDICIA_PUBLISHER IP,SERIE S,ISSUE I
    WHERE IP.ID = I.INDICIA_PUBLISHER_ID
    AND I.SERIE_ID = S.ID
    AND S.YEAR_BEGAN IS NOT NULL
    AND S.YEAR_ENDED IS NOT NULL
)
GROUP BY name
;

--Print the top 10 indicia publishers that have published the most single-issue series.:
SELECT Name,COUNT(*)
FROM(
  SELECT IP.name as name,COUNT(*) as num
  FROM INDICIA_PUBLISHER IP,SERIE S,ISSUE I
  WHERE IP.ID = I.INDICIA_PUBLISHER_ID
  AND I.SERIE_ID = S.ID
  GROUP BY IP.name,S.ID
)
WHERE num = 1
GROUP BY name
ORDER BY COUNT(*) DESC
FETCH FIRST 10 ROWS ONLY
;

--Print the 10 indicia publishers with the highest number of script writers in a single story.:
SELECT IP.name,SCR.STORY_ID,COUNT(*)
FROM INDICIA_PUBLISHER IP,STORY S,ISSUE I, SCRIPT SCR
WHERE IP.ID = I.INDICIA_PUBLISHER_ID
AND I.ID = S.issue_id
AND SCR.STORY_ID = S.ID
GROUP BY IP.name,SCR.STORY_ID
ORDER BY COUNT(*) DESC
FETCH FIRST 10 ROWS ONLY
;

--Print all Marvel heroes that appear in Marvel-DC story crossovers.:
SELECT C.name
FROM CHARACTER C,
(
SELECT  SC.CHARACTER_ID
FROM STORY_CHARACTER SC,STORY S,ISSUE I,SERIE SER,PUBLISHER P
WHERE P.name = 'Marvel'
AND P.ID = SER.PUBLISHER_ID
AND SER.ID = I.SERIE_ID
AND I.ID = S.ISSUE_ID
AND S.ID = SC.STORY_ID

INTERSECT

SELECT SC.CHARACTER_ID
FROM STORY_CHARACTER SC,STORY S,ISSUE I,SERIE SER,PUBLISHER P
WHERE P.ID = SER.PUBLISHER_ID
AND P.name LIKE '%DC%' AND P.name LIKE '%Marvel%'
AND SER.ID = I.SERIE_ID
AND I.ID = S.ISSUE_ID
AND S.ID = SC.STORY_ID
) A
WHERE A.CHARACTER_ID = C.ID
;

--Print the top 5 series with most issues:
SELECT S.name,COUNT(*)
FROM SERIE S, ISSUE I
WHERE S.ID = I.SERIE_ID
GROUP BY S.name
ORDER BY COUNT(*) DESC
FETCH FIRST 5 ROWS ONLY
;
--Given an issue, print its most reprinted story.:
SELECT Iid as id,title,numof
FROM(
  SELECT  V.*,ROW_NUMBER()
  OVER (PARTITION BY V.Iid ORDER BY V.numof) AS rn
  FROM (
    SELECT I.ID as Iid,S.title AS title,COUNT(*) as numof
    FROM Story S, ISSUE I,STORY_REPRINT SR
    WHERE I.ID = S.ISSUE_ID
    AND S.ID = SR.ORIGIN_ID
    GROUP BY I.ID,S.title
    ORDER BY I.ID,COUNT(*) DESC
    ) V
)
WHERE rn = 1
;
