"""Genera los CSV de la fase 3 a partir del piloto y de fuentes oficiales verificadas.

Uso: python scripts/generar_bloques_fase3.py
Las coordenadas se reservan para la fase 4.
"""

import csv
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "piloto_20.csv"
OUT = ROOT / "data" / "fase3"
AS_OF = "2026-09-30"
NV = "No verificado"

with SOURCE.open(encoding="utf-8-sig", newline="") as f:
    reader = csv.DictReader(f)
    FIELDS = reader.fieldnames
    rows = list(reader)


def add(id, nombre, pais_destino, entidad_oferente, pais_entidad, nivel, url_oficial, **more):
    row = {field: NV for field in FIELDS}
    row.update(
        id=id,
        nombre=nombre,
        entidad_oferente=entidad_oferente,
        pais_entidad=pais_entidad,
        pais_destino=pais_destino,
        latitud=NV,
        longitud=NV,
        nivel=nivel,
        nacionalidad_elegible="Colombia",
        fecha_consulta_estado=AS_OF,
        url_oficial=url_oficial,
        fuente_de_verificacion=url_oficial,
        fecha_ultima_verificacion=AS_OF,
        nivel_de_confianza="alto",
        tipo_financiacion="beca",
        precision_ubicacion="país",
        fechas_sujetas_a_cambio="Sí",
    )
    unknown = set(more) - set(FIELDS)
    if unknown:
        raise ValueError(f"Campos desconocidos en {id}: {unknown}")
    row.update(more)
    rows.append(row)


# Alemania: la oficina del DAAD en Bogotá indica expresamente que sus guías
# son para solicitantes de Colombia, Ecuador, Perú y Venezuela.
DAAD = "https://www.daad.co/es/becas/becas-de-posgrado/maestria-2/"
add("DAAD-PPGG-2027", "DAAD Helmut Schmidt / PPGG", "Alemania", "DAAD", "Alemania", "maestría", DAAD,
    area_conocimiento="Política pública; buen gobierno", cobertura="manutención; pasaje; seguro; curso de alemán",
    monto_aproximado_y_moneda="992 EUR/mes", requisitos_clave="Admisión a uno de siete másteres elegibles; requisitos del programa",
    fecha_cierre="2026-07-31", periodicidad="anual", estado_convocatoria="cerrada",
    notas="Cohorte 2027; guía DAAD Colombia. Revisar cada programa.",
    evidencia_elegibilidad_colombianos="DAAD Bogotá publica guía para postulantes de Colombia")
add("DAAD-STEM-2027", "DAAD maestrías STEM", "Alemania", "DAAD", "Alemania", "maestría", DAAD,
    area_conocimiento="Ciencia; tecnología; ingeniería; matemáticas", cobertura="manutención; pasaje; seguro; curso de alemán",
    monto_aproximado_y_moneda="992 EUR/mes", requisitos_clave="Título afín y admisión a maestría STEM elegible",
    fecha_cierre="2026-09-03", periodicidad="anual", estado_convocatoria="cerrada",
    notas="Cohorte 2027; cierre de la edición 2026 según DAAD Bogotá.",
    evidencia_elegibilidad_colombianos="DAAD Bogotá publica guía para postulantes de Colombia")
add("DAAD-HSK-2027", "DAAD cursos de verano de alemán (HSK)", "Alemania", "DAAD", "Alemania", "idiomas; curso corto", DAAD,
    area_conocimiento="Idioma alemán", cobertura="curso; manutención; pasaje; seguro",
    requisitos_clave="Estudiar pregrado o maestría en universidad colombiana; cumplir idioma de la convocatoria",
    fecha_cierre="2026-10-30", periodicidad="anual", estado_convocatoria="abierta",
    notas="Curso intensivo de cuatro semanas; ciudad e institución según asignación.",
    evidencia_elegibilidad_colombianos="DAAD menciona estudiantes de universidades en Colombia")
add("DAAD-HWK-2027", "DAAD cursos de invierno de alemán (HWK)", "Alemania", "DAAD", "Alemania", "idiomas; curso corto", DAAD,
    area_conocimiento="Idioma alemán", cobertura="curso; manutención; pasaje; seguro", idioma_requerido="Alemán B1",
    requisitos_clave="Estudiar pregrado, maestría o doctorado en universidad colombiana; alemán B1",
    fecha_cierre="2026-07-31", periodicidad="anual", estado_convocatoria="cerrada",
    notas="Curso intensivo de cuatro semanas; ciudad e institución según asignación.",
    evidencia_elegibilidad_colombianos="DAAD menciona estudiantes de universidades en Colombia")

# Australia: estas becas institucionales admiten estudiantes internacionales.
add("MONASH-MGS-2027", "Monash Graduate Scholarship", "Australia", "Monash University", "Australia", "maestría; doctorado",
    "https://www.monash.edu/study/fees-scholarships/scholarships/find-a-scholarship/monash-graduate-scholarship-mgs?international=true",
    ciudad="Melbourne", universidad="Monash University", area_conocimiento="Investigación; diferentes áreas",
    cobertura="manutención; traslado sujeto a elegibilidad", monto_aproximado_y_moneda="41100 AUD/año (tarifa 2027)",
    idioma_requerido="Inglés según admisión Monash", requisitos_clave="Admisión a maestría de investigación o doctorado; selección competitiva",
    fecha_cierre="2027-02-28", periodicidad="semestral", estado_convocatoria="recurrente", precision_ubicacion="ciudad",
    notas="Ronda internacional siguiente: febrero 2027; otra ronda internacional cerró 31-08-2026. Matrícula requiere beca separada.",
    evidencia_elegibilidad_colombianos="Universidad admite explícitamente estudiantes internacionales")
add("MELBOURNE-HUMPHREY-2027", "Gordon and Isabel Humphrey Scholarship", "Australia", "University of Melbourne", "Australia", "doctorado",
    "https://scholarships.unimelb.edu.au/awards/gordon-and-isabel-humphrey-scholarship",
    ciudad="Melbourne", universidad="University of Melbourne", area_conocimiento="Ingeniería",
    cobertura="manutención; traslado; seguro", monto_aproximado_y_moneda="41100 AUD/año (2027); hasta 140000 AUD",
    requisitos_clave="Oferta para PhD Engineering con inicio en 2027; declaración personal",
    fecha_apertura="2026-08-28", fecha_cierre="2026-10-25", periodicidad="anual", estado_convocatoria="abierta",
    precision_ubicacion="ciudad", notas="La fuente no confirma exención de matrícula.",
    evidencia_elegibilidad_colombianos="Universidad admite explícitamente estudiantes internacionales")
add("SYDNEY-RTP-2027-R34", "RTP International — University of Sydney", "Australia", "Gobierno de Australia / University of Sydney", "Australia", "maestría; doctorado",
    "https://www.sydney.edu.au/scholarships/australian-government-research-training-program/rtp-international.html",
    ciudad="Sídney", universidad="University of Sydney", area_conocimiento="Investigación; diferentes áreas",
    cobertura="matrícula; manutención; seguro; traslado", monto_aproximado_y_moneda="44293 AUD/año (tarifa 2027)",
    requisitos_clave="Solicitar admisión a grado de investigación y formulario de beca; selección competitiva",
    fecha_cierre="2026-12-18", periodicidad="semestral", estado_convocatoria="abierta", precision_ubicacion="ciudad",
    notas="Ronda para períodos de investigación 3 y 4 de 2027; la ronda 1/2 cerró 11-09-2026.",
    evidencia_elegibilidad_colombianos="Universidad admite explícitamente estudiantes internacionales")

# Canadá: ELAP se postula por institución canadiense, no directamente.
add("ELAP-2026", "Emerging Leaders in the Americas Program (ELAP)", "Canadá", "Global Affairs Canada", "Canadá", "intercambio; curso corto",
    "https://www.educanada.ca/scholarships-bourses/can/institutions/elap-pfla.aspx?lang=eng",
    area_conocimiento="Diferentes áreas", cobertura="manutención; movilidad; matrícula exenta por institución",
    monto_aproximado_y_moneda="8600 CAD/4 meses o 12400 CAD/5–6 meses",
    requisitos_clave="Ciudadanía colombiana; matrícula vigente en institución de origen; nominación por institución canadiense",
    fecha_cierre="2026-03-31", periodicidad="anual", estado_convocatoria="cerrada",
    notas="El cierre es para instituciones canadienses; no se aceptan solicitudes directas de estudiantes.",
    evidencia_elegibilidad_colombianos="EduCanada enumera Colombia entre países elegibles")
add("UBC-IS-2027", "UBC International Scholars Program", "Canadá", "University of British Columbia", "Canadá", "pregrado",
    "https://you.ubc.ca/financial-planning/scholarships-awards-international-students/international-scholars/",
    universidad="University of British Columbia", area_conocimiento="Diferentes áreas elegibles", cobertura="apoyo según necesidad financiera",
    idioma_requerido="Inglés según admisión UBC", requisitos_clave="Primer pregrado; egreso escolar reciente; nominación; excelencia; necesidad financiera",
    fecha_apertura="2026-10-05", fecha_cierre="2026-11-15", periodicidad="anual", estado_convocatoria="recurrente",
    notas="Cohorte septiembre 2027; la página anuncia apertura 05-10-2026. Cierre 15-11-2026; campus Vancouver u Okanagan.",
    evidencia_elegibilidad_colombianos="Programa abierto a estudiantes internacionales con permiso de estudios")
add("CGRS-D-2026", "Canada Graduate Research Scholarship — Doctoral", "Canadá", "CIHR / NSERC / SSHRC", "Canadá", "doctorado",
    "https://nserc.canada.ca/en/funding-opportunity/canada-graduate-research-scholarship-doctoral-program",
    area_conocimiento="Salud; ciencias; ingeniería; humanidades; ciencias sociales", cobertura="manutención",
    monto_aproximado_y_moneda="40000 CAD/año por 36 meses",
    requisitos_clave="Estudiante internacional ya matriculado en doctorado canadiense elegible antes del cierre; cupo hasta 15 %",
    fecha_cierre=NV, periodicidad="anual", estado_convocatoria="recurrente",
    notas="Para internacionales el plazo lo determina la universidad y puede preceder al 17 de octubre de la agencia. No financia ingreso inicial desde Colombia.",
    evidencia_elegibilidad_colombianos="Regla oficial admite internacionales matriculados en PhD canadiense")

# Países Bajos: Maastricht incorpora NL Scholarship, por lo que hay posible
# solapamiento de financiación, explícito en notas para la fase 4.
add("NL-SCHOLARSHIP-2026", "NL Scholarship", "Países Bajos", "Ministerio de Educación de Países Bajos / universidades", "Países Bajos", "pregrado; maestría",
    "https://studyinnl.org/finances/nl-scholarship",
    area_conocimiento="Según institución participante", cobertura="parcial", monto_aproximado_y_moneda="5000 EUR primer año",
    requisitos_clave="Nacionalidad fuera del EEE; admisión a institución participante; sin título previo neerlandés",
    fecha_apertura="2025-11-01", fecha_cierre=NV, periodicidad="anual", estado_convocatoria="recurrente",
    notas="Plazos y programas varían por universidad. Incluye componente de Maastricht NL-High Potential; no sumar financiación de ambas.",
    evidencia_elegibilidad_colombianos="Colombia no pertenece al Espacio Económico Europeo; regla oficial para no EEE")
add("MAASTRICHT-NLHP-2027", "Maastricht University NL-High Potential Scholarship", "Países Bajos", "Maastricht University / NL Scholarship", "Países Bajos", "maestría",
    "https://www.maastrichtuniversity.nl/studeren/toelating-inschrijving/financing-your-studies/scholarships/maastricht-university-nl-high",
    ciudad="Maastricht", universidad="Maastricht University", area_conocimiento="Másteres participantes", cobertura="matrícula; manutención; seguro; visado",
    monto_aproximado_y_moneda="20150 EUR/13 meses o 38750 EUR/25 meses más matrícula",
    requisitos_clave="No UE/EEE; menor o igual a 35 años; promedio mínimo 7.5/10; expediente de admisión completo antes de 10-12-2026",
    fecha_apertura="2026-10-01", fecha_cierre="2027-02-01", periodicidad="anual", estado_convocatoria="recurrente", precision_ubicacion="ciudad",
    notas="Cohorte 2027/28; abre un día después de la consulta. Incluye componente NL Scholarship; pasajes no cubiertos.",
    evidencia_elegibilidad_colombianos="Nacionalidad colombiana cumple regla no UE/EEE publicada por Maastricht")

# Suecia: elegibilidad por ciudadanía fuera de UE/EEE.
add("LUND-GLOBAL-2026", "Lund University Global Scholarship", "Suecia", "Lund University", "Suecia", "maestría; pregrado",
    "https://www.lunduniversity.lu.se/study/admission-degree-studies/scholarships-and-awards/lund-university-global-scholarship",
    ciudad="Lund", universidad="Lund University", area_conocimiento="Diferentes áreas; pregrados seleccionados",
    cobertura="matrícula parcial o total", requisitos_clave="Ciudadanía no UE/EEE; programa Lund como primera opción; solvencia para manutención",
    fecha_cierre="2026-02-16", periodicidad="anual", estado_convocatoria="cerrada", precision_ubicacion="ciudad",
    notas="No cubre manutención; siguiente ronda usualmente en febrero.",
    evidencia_elegibilidad_colombianos="Colombia cumple regla oficial de ciudadanía fuera de UE/EEE")
add("LUND-KAMPRAD-2026", "Ingvar Kamprad Scholarship", "Suecia", "Lund University / IKEA Foundation", "Suecia", "maestría",
    "https://www.lunduniversity.lu.se/study/admission-degree-studies/scholarships-and-awards/ingvar-kamprad-scholarship",
    ciudad="Lund", universidad="Lund University", area_conocimiento="Diseño industrial",
    cobertura="matrícula; manutención según modalidad", monto_aproximado_y_moneda="270000 SEK/año matrícula o 128400 SEK/año manutención",
    requisitos_clave="Admisión al máster en diseño industrial; modalidad de matrícula para no UE/EEE",
    fecha_cierre="2026-04-13", periodicidad="anual", estado_convocatoria="cerrada", precision_ubicacion="ciudad",
    notas="Dos modalidades dentro de una misma solicitud; se puede postular a una o ambas.",
    evidencia_elegibilidad_colombianos="Modalidad de matrícula abierta a ciudadanos no UE/EEE")

add("SI-GLOBAL-2026", "Swedish Institute Scholarship for Global Professionals", "Suecia", "Swedish Institute", "Suecia", "maestría",
    "https://apply-scholarships.si.se/en_GB/courses/course/1209-tourism-and-sustainable-development",
    universidad="Según máster elegible", area_conocimiento="Según máster elegible", cobertura=NV,
    requisitos_clave="Ciudadanía colombiana; admisión a máster elegible; requisitos específicos del Swedish Institute",
    fecha_cierre=NV, periodicidad="anual", estado_convocatoria="cerrada", nivel_de_confianza="medio",
    notas="Ficha oficial de máster elegible en Umeå; portal indica que no acepta postulaciones actualmente. Cobertura y cierre del programa paraguas requieren verificación adicional.",
    evidencia_elegibilidad_colombianos="Portal oficial SI enumera expresamente Colombia entre territorios elegibles")
# China: dos niveles CSC Type A de la misma convocatoria, más programa MOFCOM
# con requisitos y financiación propios.
add("CSC-CHINA-M-2026", "Beca Gobierno de China / CSC Type A — maestría", "China", "Gobierno de China / ICETEX", "China", "maestría",
    "https://web.icetex.gov.co/es/-/nov-2025-maestrias-en-diferentes-areas-en-china",
    area_conocimiento="Diferentes áreas", cobertura="matrícula; alojamiento; seguro; manutención",
    monto_aproximado_y_moneda="3000 CNY/mes; seguro 800 CNY/año; ICETEX indica 85 %",
    idioma_requerido="Inglés o mandarín según programa", requisitos_clave="Profesional colombiano; formulario CSC Type A; requisitos ICETEX",
    fecha_apertura="2025-12-01", fecha_cierre="2026-01-30", periodicidad="anual", estado_convocatoria="cerrada",
    notas="Modalidad maestría de convocatoria CSC Type A; no duplicar con doctorado al contar convocatorias.",
    evidencia_elegibilidad_colombianos="Convocatoria oficial ICETEX para colombianos")
add("CSC-CHINA-D-2026", "Beca Gobierno de China / CSC Type A — doctorado", "China", "Gobierno de China / ICETEX", "China", "doctorado",
    "https://web.icetex.gov.co/es/-/2026-doctorados-en-diferentes-areas-en-china",
    area_conocimiento="Diferentes áreas", cobertura="matrícula; alojamiento; seguro; manutención",
    monto_aproximado_y_moneda="3500 CNY/mes; seguro 800 CNY/año; ICETEX indica 85 %",
    idioma_requerido="Inglés o mandarín según programa", requisitos_clave="Maestría previa; formulario CSC Type A; requisitos ICETEX",
    fecha_apertura="2025-12-01", fecha_cierre="2026-01-30", periodicidad="anual", estado_convocatoria="cerrada",
    notas="Modalidad doctorado de convocatoria CSC Type A; no duplicar con maestría al contar convocatorias.",
    evidencia_elegibilidad_colombianos="Convocatoria oficial ICETEX para colombianos")
add("MOFCOM-CSC-2026", "MOFCOM CSC — maestrías y doctorados", "China", "Ministerio de Comercio de China / ICETEX", "China", "maestría; doctorado",
    "https://web.icetex.gov.co/-/becas-mofcom-csc-maestrias-doctorados-china",
    area_conocimiento="Gobierno; comercio; agricultura; tecnología; educación; salud", cobertura="matrícula; alojamiento; manutención; seguro; pasaje",
    monto_aproximado_y_moneda="36000 CNY/año maestría o 42000 CNY/año doctorado",
    idioma_requerido="Inglés B2 maestría o C1 doctorado", requisitos_clave="Servidor público o profesional/directivo residente en Colombia; 36 meses de experiencia; promedio 4.0/5.0",
    fecha_apertura="2026-04-06", fecha_cierre="2026-04-30", periodicidad=NV, estado_convocatoria="cerrada",
    notas="Programa MOFCOM distinto del CSC Type A general; selección de universidades en anexo oficial.",
    evidencia_elegibilidad_colombianos="ICETEX indica expresamente profesionales y servidores públicos colombianos")

# España: posgrado y doctorado tienen fechas y poblaciones de acceso distintas.
add("CAROLINA-PG-2026", "Fundación Carolina — posgrado 2026/27", "España", "Fundación Carolina", "España", "maestría",
    "https://www.fundacioncarolina.es/convocatoria-de-becas-2026-2027/",
    area_conocimiento="Diferentes áreas y programas", cobertura="Según programa", requisitos_clave="Admisión y condiciones del programa específico; ciudadanía iberoamericana",
    fecha_apertura="2026-01-12", fecha_cierre="2026-03-02", periodicidad="anual", estado_convocatoria="cerrada",
    notas="Registro paraguas: cada uno de los 203 programas académicos tiene cobertura propia; revisar ficha antes de postular.",
    evidencia_elegibilidad_colombianos="Fundación Carolina dirige la convocatoria a Iberoamérica e incluye Fundación Carolina Colombia")
add("CAROLINA-D-2026", "Fundación Carolina — doctorado 2026/27", "España", "Fundación Carolina", "España", "doctorado",
    "https://gestion.fundacioncarolina.es/programas/6519",
    area_conocimiento="Diferentes áreas", cobertura="matrícula; manutención; pasaje; seguro",
    monto_aproximado_y_moneda="1200 EUR/mes durante estancias; pasajes anuales",
    requisitos_clave="Docente o personal de universidad latinoamericana asociada; nominación institucional; título de maestría; preadmisión española",
    fecha_apertura="2026-01-12", fecha_cierre="2026-04-09", periodicidad="anual", estado_convocatoria="cerrada",
    notas="Estancias distribuidas en cuatro años; no es postulación individual directa.",
    evidencia_elegibilidad_colombianos="Regla oficial incluye países latinoamericanos de Comunidad Iberoamericana; Colombia")

# Francia y Reino Unido.
add("SCIENCESPO-BOUTMY-U-2027", "Émile Boutmy — pregrado", "Francia", "Sciences Po", "Francia", "pregrado",
    "https://www.sciencespo.fr/students/en/fees-funding/bursaries-financial-aid/emile-boutmy-scholarship/",
    universidad="Sciences Po", area_conocimiento="Ciencias sociales; política pública", cobertura="matrícula total o parcial",
    monto_aproximado_y_moneda="Exención total o 9500 EUR de matrícula",
    requisitos_clave="Primer ingreso; ciudadanía no UE; hogar sin tributación UE; admisión a programa elegible",
    fecha_cierre="2027-01-13", periodicidad="anual", estado_convocatoria="recurrente",
    notas="Cierre para estudiantes procedentes de colegios extranjeros; apertura no publicada en página consultada.",
    evidencia_elegibilidad_colombianos="Sciences Po admite aspirantes de países fuera de la UE")
add("SALFORD-ICETEX-2027", "University of Salford — descuento de maestría", "Reino Unido", "University of Salford / ICETEX", "Reino Unido", "maestría",
    "https://web.icetex.gov.co/es/-/descuentos-maestrias-university-salford",
    ciudad="Salford", universidad="University of Salford", area_conocimiento="Diferentes áreas", cobertura="matrícula parcial; una exención total",
    monto_aproximado_y_moneda="5000 GBP de descuento; una beca de 100 % matrícula",
    idioma_requerido="Inglés según programa", requisitos_clave="Profesional colombiano; admisión definitiva; promedio mínimo 3.7/5.0; 21–64 años",
    fecha_apertura="2026-08-14", fecha_cierre="2027-02-26", periodicidad=NV, estado_convocatoria="abierta", precision_ubicacion="ciudad",
    notas="ICETEX identifica ciudad Manchester; campus de Salford se registra como Salford. Manutención y viaje no cubiertos.",
    evidencia_elegibilidad_colombianos="Convocatoria ICETEX dirigida expresamente a profesionales colombianos")

# Becas y créditos condonables dentro de Colombia.
add("UNIANDES-QUIERO-2027", "Quiero Estudiar — Universidad de los Andes", "Colombia", "Universidad de los Andes", "Colombia", "pregrado",
    "https://apoyofinanciero.uniandes.edu.co/quiero-estudiar",
    ciudad="Bogotá", universidad="Universidad de los Andes", area_conocimiento="Diferentes áreas", cobertura="hasta 95 % de matrícula",
    monto_aproximado_y_moneda="Hasta 95 % de matrícula semestral",
    requisitos_clave="Admisión a primer pregrado; 16–21 años; excelencia Saber 11; necesidad financiera; preselección",
    fecha_apertura="2026-08-14", fecha_cierre="2026-11-08", periodicidad="semestral", estado_convocatoria="abierta", precision_ubicacion="ciudad",
    tipo_financiacion="apoyo con compromiso de devolución",
    notas="Requiere preselección; tres cierres internos. Tras graduación, compromiso de aportar 20 % de ingresos por el doble del tiempo apoyado.",
    evidencia_elegibilidad_colombianos="Programa dirigido a admitidos de cualquier región de Colombia; verificar otros requisitos individuales")
add("ICETEX-INDIGENAS-2026-2", "Fondo Álvaro Ulcué Chocué — estudios en Colombia", "Colombia", "ICETEX / Ministerio de Educación", "Colombia", "pregrado; maestría; doctorado",
    "https://web.icetex.gov.co/es/-/este-23-julio-abre-nueva-convocatoria-fondo-alvaro-ulcue-chocue-miembros-pueblos-indigenas",
    area_conocimiento="Diferentes áreas", cobertura="matrícula o manutención", monto_aproximado_y_moneda="Hasta 4 salarios mínimos por semestre",
    requisitos_clave="Pertenecer a pueblo indígena de Colombia; proyecto o trabajo en beneficio comunitario; términos del fondo",
    fecha_apertura="2026-07-23", fecha_cierre="2026-08-11", periodicidad=NV, estado_convocatoria="cerrada",
    tipo_financiacion="crédito 100 % condonable", notas="La misma convocatoria permite estudiar fuera de Colombia; aquí se representa su ruta nacional sin crear otro registro.",
    evidencia_elegibilidad_colombianos="Fondo ICETEX para miembros de pueblos indígenas colombianos")
add("ICETEX-COMUNIDADES-NEGRAS-2026-2", "Fondo Comunidades Negras — pregrado en Colombia", "Colombia", "ICETEX / Ministerio de Educación", "Colombia", "pregrado",
    "https://web.icetex.gov.co/es/-/llega-nueva-convocatoria-fondo-comunidades-negras-que-otorga-credito-100-condonable-estudios-educacion-superior",
    area_conocimiento="Diferentes áreas", cobertura="matrícula o manutención", monto_aproximado_y_moneda="3 salarios mínimos por semestre",
    requisitos_clave="Ciudadanía colombiana; pertenecer a pueblos negros, afrocolombianos, raizales o palenqueros; términos del fondo",
    fecha_apertura="2026-07-21", fecha_cierre="2026-08-21", periodicidad=NV, estado_convocatoria="cerrada",
    tipo_financiacion="crédito 100 % condonable", notas="Esta fila representa la modalidad pregrado nacional; el mismo fondo permite posgrado nacional o exterior.",
    evidencia_elegibilidad_colombianos="ICETEX indica expresamente personas colombianas de comunidades elegibles")

# Destino multinacional: se conserva un único registro por programa paraguas.
add("ERASMUS-MUNDUS-JM-2027", "Erasmus Mundus Joint Masters", "Varios", "Comisión Europea / consorcios universitarios", "Unión Europea", "maestría",
    "https://erasmus-plus.ec.europa.eu/opportunities/individuals/students/erasmus-mundus-joint-masters",
    area_conocimiento="Según consorcio", cobertura="costos de participación; viaje; visado; manutención",
    requisitos_clave="Título de pregrado o último año; admisión a máster del catálogo; fechas por consorcio",
    fecha_cierre=NV, periodicidad="anual", estado_convocatoria="recurrente", precision_ubicacion="sin ubicación única",
    notas="Normalmente solicitudes entre octubre y enero; no se asigna país único ni plazo universal.",
    evidencia_elegibilidad_colombianos="Comisión Europea indica estudiantes de todo el mundo")


SLUGS = {
    "Alemania": "alemania", "Australia": "australia", "Canadá": "canada", "Chile": "chile",
    "China": "china", "Colombia": "colombia", "Corea del Sur": "corea_del_sur",
    "España": "espana", "Estados Unidos": "estados_unidos", "Francia": "francia",
    "India": "india", "Japón": "japon", "México": "mexico", "Países Bajos": "paises_bajos",
    "Reino Unido": "reino_unido", "Singapur": "singapur", "Suecia": "suecia", "Varios": "varios_destinos",
}

assert len(rows) == 46, len(rows)
assert len({r["id"] for r in rows}) == len(rows), "ID duplicado"
assert len({r["url_oficial"] for r in rows if r["id"] not in {"MINCIENCIAS-975-M-2026", "MINCIENCIAS-975-D-2026", "CSC-CHINA-M-2026", "CSC-CHINA-D-2026"}}) > 30
for row in rows:
    assert set(row) == set(FIELDS), row["id"]
    assert row["pais_destino"] in SLUGS, row["id"]
    assert row["url_oficial"].startswith("https://"), row["id"]
    assert row["fecha_ultima_verificacion"] == AS_OF, row["id"]
    assert row["estado_convocatoria"] in {"abierta", "cerrada", "recurrente"}, row["id"]
    assert row["latitud"] == NV and row["longitud"] == NV, row["id"]
    assert all(value for value in row.values()), row["id"]

OUT.mkdir(parents=True, exist_ok=True)
by_country = defaultdict(list)
for row in rows:
    by_country[row["pais_destino"]].append(row)

for country, group in sorted(by_country.items()):
    path = OUT / f"{SLUGS[country]}.csv"
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS, lineterminator="\n")
        writer.writeheader()
        writer.writerows(sorted(group, key=lambda item: item["id"]))

with (OUT / "indice.csv").open("w", encoding="utf-8-sig", newline="") as f:
    writer = csv.writer(f, lineterminator="\n")
    writer.writerow(["pais_destino", "archivo", "becas", "abiertas", "cerradas", "recurrentes", "fecha_consulta"])
    for country, group in sorted(by_country.items()):
        counts = Counter(row["estado_convocatoria"] for row in group)
        writer.writerow([country, f"{SLUGS[country]}.csv", len(group), counts["abierta"], counts["cerrada"], counts["recurrente"], AS_OF])

print(f"{len(rows)} registros en {len(by_country)} bloques: {dict(sorted((k, len(v)) for k,v in by_country.items()))}")


