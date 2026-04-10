from django.test import TestCase
from django.http import QueryDict
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils.datastructures import MultiValueDict
from utils.formart import convert_document_multipart_to_json
import json


class ConvertMultipartToJsonTest(TestCase):

    def get_test_file(self, name="doc.jpg"):
        return SimpleUploadedFile(name, b"img", content_type="image/jpeg")

    def test_success_full_conversion(self):
        data = QueryDict(mutable=True)
        data.update({
            "purpose": "DPVAT",
            "applicant": json.dumps({"name": "João"}),
            "incident": json.dumps({"city": "RJ"}),
        })
        data.setlist("document_types", ["PATIENT_ID"])

        files = MultiValueDict({
            "documents": [self.get_test_file()]
        })

        result = convert_document_multipart_to_json(data, files)

        self.assertEqual(result["purpose"], "DPVAT")
        self.assertEqual(result["applicant"]["name"], "João")
        self.assertEqual(result["incident"]["city"], "RJ")
        self.assertEqual(result["document_types"], ["PATIENT_ID"])
        self.assertEqual(len(result["documents"]), 1)

    def test_invalid_json_should_not_break(self):
        data = QueryDict(mutable=True)
        data.update({
            "applicant": "{invalid_json}",
        })

        files = MultiValueDict()

        result = convert_document_multipart_to_json(data, files)

        # mantém como string
        self.assertEqual(result["applicant"], "{invalid_json}")

    def test_document_types_as_list(self):
        data = QueryDict(mutable=True)
        data.setlist("document_types", ["A", "B", "C"])

        files = MultiValueDict()

        result = convert_document_multipart_to_json(data, files)

        self.assertEqual(result["document_types"], ["A", "B", "C"])

    def test_documents_from_files(self):
        data = QueryDict(mutable=True)
        files = MultiValueDict({
            "documents": [self.get_test_file(), self.get_test_file()]
        })

        result = convert_document_multipart_to_json(data, files)

        self.assertEqual(len(result["documents"]), 2)

    def test_single_document_in_data(self):
        file = self.get_test_file()

        data = {
            "documents": file
        }

        files = MultiValueDict()

        result = convert_document_multipart_to_json(data, files)

        self.assertEqual(len(result["documents"]), 1)

    def test_missing_fields_should_return_defaults(self):
        data = QueryDict(mutable=True)
        files = MultiValueDict()

        result = convert_document_multipart_to_json(data, files)

        self.assertIsNone(result["purpose"])
        self.assertEqual(result["applicant"], {})
        self.assertEqual(result["incident"], {})
        self.assertEqual(result["document_types"], [])
        self.assertEqual(result["documents"], [])