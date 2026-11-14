from django.core.management import call_command
from django.test import Client, TestCase
from catalog.models import Artifact, Body, Source


class CatalogModelsAndApiTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.moon = Body.objects.create(
            name="Moon",
            code="moon",
            radius_scene=1.0,
            texture_file="textures/moon_2k.jpg",
            description="Earth natural satellite.",
        )
        self.mars = Body.objects.create(
            name="Mars",
            code="mars",
            radius_scene=1.95,
            texture_file="textures/mars_2k.jpg",
            description="The Red Planet.",
        )
        self.apollo11 = Artifact.objects.create(
            name="Apollo 11 LM Eagle",
            code="apollo-11-lm",
            artifact_type="lander",
            body=self.moon,
            latitude=0.67408,
            longitude=23.47297,
            status="Resting at Tranquility Base",
            brief_description="Descent stage of Apollo 11.",
            first_person_story="I was built not to return, but to deliver humanity.",
            key_facts=["First human lunar landing.", "Landed with low fuel."],
            fleet_members=[
                {"mission": "Apollo 12", "landing_site": "Oceanus Procellarum"},
                {"mission": "Apollo 14", "landing_site": "Fra Mauro"},
            ],
            translations={
                "ru": {
                    "name": "Лунный модуль Apollo 11",
                    "status": "Покоится на Базе Спокойствия",
                    "first_person_story": "История на русском языке",
                },
                "kk": {
                    "name": "Apollo 11 ай модулі",
                    "status": "Тыныштық базасында",
                    "first_person_story": "Қазақ тіліндегі оқиға",
                },
            },
            priority=1,
        )
        self.source = Source.objects.create(
            artifact=self.apollo11,
            title="NASA NSSDCA Apollo 11",
            url="https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C",
            details="Master catalog record.",
        )

    def test_body_str_and_properties(self):
        self.assertEqual(str(self.moon), "Moon")
        self.assertEqual(self.moon.artifacts.count(), 1)

    def test_artifact_str_and_fleet(self):
        self.assertIn("Apollo 11 LM Eagle", str(self.apollo11))
        self.assertEqual(len(self.apollo11.fleet_members), 2)
        self.assertEqual(self.apollo11.sources.count(), 1)

    def test_api_bodies(self):
        response = self.client.get("/api/bodies/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("bodies", data)
        self.assertGreaterEqual(len(data["bodies"]), 2)

    def test_api_artifacts_filter(self):
        response = self.client.get("/api/artifacts/?body=moon")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["artifacts"]), 1)
        self.assertEqual(data["artifacts"][0]["code"], "apollo-11-lm")

    def test_api_artifact_detail(self):
        response = self.client.get("/api/artifacts/apollo-11-lm/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["name"], "Apollo 11 LM Eagle")
        self.assertEqual(len(data["fleet_members"]), 2)
        self.assertEqual(len(data["sources"]), 1)
        self.assertEqual(data["sources"][0]["title"], "NASA NSSDCA Apollo 11")

    def test_api_artifact_detail_not_found(self):
        response = self.client.get("/api/artifacts/non-existent-code/")
        self.assertEqual(response.status_code, 404)

    def test_api_artifact_detail_multilingual(self):
        response_ru = self.client.get("/api/artifacts/apollo-11-lm/?lang=ru")
        self.assertEqual(response_ru.status_code, 200)
        self.assertEqual(response_ru.json()["name"], "Лунный модуль Apollo 11")
        self.assertEqual(response_ru.json()["status"], "Покоится на Базе Спокойствия")

        response_kk = self.client.get("/api/artifacts/apollo-11-lm/?lang=kk")
        self.assertEqual(response_kk.status_code, 200)
        self.assertEqual(response_kk.json()["name"], "Apollo 11 ай модулі")
        self.assertEqual(response_kk.json()["status"], "Тыныштық базасында")
