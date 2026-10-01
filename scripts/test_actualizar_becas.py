"""Pruebas del parser de fechas y aplicación de evidencia revisada."""
import csv
import tempfile
import unittest
from datetime import date
from pathlib import Path
from unittest.mock import patch

import actualizar_becas

from actualizar_becas import TextExtractor, apply_reviews, extract_candidates, parse_date


class UpdateTests(unittest.TestCase):
    def test_dates_near_distinct_deadlines_stay_as_candidates(self):
        html = """<main><p>Programa A — Fecha de cierre: 31 de julio, 2026.</p>
        <p>Programa B — Fecha de cierre: 30 de octubre, 2026.</p>
        <script>deadline = '2027-01-01'</script></main>"""
        parser = TextExtractor()
        parser.feed(html)
        dates = {value for value, _ in extract_candidates(" ".join(parser.parts), date(2026, 9, 30))}
        self.assertEqual(dates, {"2026-07-31", "2026-10-30"})

    def test_invalid_date_is_rejected(self):
        self.assertIsNone(parse_date("31 de febrero 2026"))
        self.assertEqual(parse_date("2027-01-09"), "2027-01-09")

    def test_review_needs_evidence_and_updates_only_named_fields(self):
        rows = [{
            "id": "B-1", "fecha_cierre": "2026-06-01", "fecha_apertura": "No verificado",
            "estado_convocatoria": "cerrada", "fecha_consulta_estado": "2026-09-30",
            "fuente_de_verificacion": "https://example.edu/old", "fecha_ultima_verificacion": "2026-09-30",
            "notas": "Original.",
        }]
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "reviews.csv"
            with path.open("w", encoding="utf-8", newline="") as handle:
                writer = csv.DictWriter(handle, fieldnames=[
                    "id", "accion", "fecha_cierre", "fecha_apertura", "estado_convocatoria",
                    "url_oficial_nueva", "url_evidencia", "fecha_verificacion", "nota",
                ])
                writer.writeheader()
                writer.writerow({
                    "id": "B-1", "accion": "actualizar", "fecha_cierre": "2027-06-01", "fecha_apertura": "", "url_oficial_nueva": "",
                    "estado_convocatoria": "abierta", "url_evidencia": "https://example.edu/new",
                    "fecha_verificacion": "2026-09-30", "nota": "Nueva edición verificada.",
                })
            self.assertEqual(apply_reviews(rows, path, date(2026, 9, 30)), ({"B-1"}, set()))
            self.assertEqual(rows[0]["fecha_cierre"], "2027-06-01")
            self.assertEqual(rows[0]["fecha_apertura"], "No verificado")
            self.assertEqual(rows[0]["fuente_de_verificacion"], "https://example.edu/new")

    def test_retirement_removes_ineligible_record_with_audit(self):
        rows = [{"id": "B-2", "nombre": "Beca antigua"}]
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            path = folder / "reviews.csv"
            with path.open("w", encoding="utf-8", newline="") as handle:
                writer = csv.DictWriter(handle, fieldnames=[
                    "id", "accion", "fecha_cierre", "fecha_apertura", "estado_convocatoria",
                    "url_oficial_nueva", "url_evidencia", "fecha_verificacion", "nota",
                ])
                writer.writeheader()
                writer.writerow({
                    "id": "B-2", "accion": "retirar", "fecha_cierre": "", "fecha_apertura": "",
                    "estado_convocatoria": "", "url_oficial_nueva": "",
                    "url_evidencia": "https://example.edu/eligibility",
                    "fecha_verificacion": "2026-09-30", "nota": "Colombia ya no es elegible.",
                })
            with patch.object(actualizar_becas, "RETIRED", folder / "retiros.csv"):
                self.assertEqual(apply_reviews(rows, path, date(2026, 9, 30)), (set(), {"B-2"}))
                self.assertEqual(rows, [])
                self.assertEqual(len(actualizar_becas.read_csv(folder / "retiros.csv")[1]), 1)


if __name__ == "__main__":
    unittest.main()
