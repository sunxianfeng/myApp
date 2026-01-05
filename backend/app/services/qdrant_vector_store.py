"""Qdrant-backed vector store.

This module provides a minimal wrapper compatible with the existing
`app.services.vector_store.VectorStore` interface:
- `add_vector(id, vector, metadata=None, document=None) -> bool`
- `search_vector(vector, limit=10) -> dict`

The returned search dict matches the ChromaDB shape used by `QuestionService`:
{
  "ids": [[...]],
  "distances": [[...]],
  "metadatas": [[...]],
  "documents": [[...]],
}
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


class QdrantVectorStore:
    def __init__(
        self,
        url: str,
        api_key: Optional[str],
        collection_name: str,
        vector_size: int = 384,
        distance: str = "cosine",
        timeout: float = 30.0,
    ) -> None:
        if not url:
            raise ValueError("Qdrant URL is required")
        if not collection_name:
            raise ValueError("Qdrant collection_name is required")
        if vector_size <= 0:
            raise ValueError("vector_size must be > 0")

        # Lazy import so environments without qdrant-client can still import the app.
        from qdrant_client import QdrantClient

        self.client = QdrantClient(url=url, api_key=api_key, timeout=timeout)
        self.collection_name = collection_name
        self.vector_size = vector_size
        self.distance = distance.lower()

        self._ensure_collection()

    def _ensure_collection(self) -> None:
        try:
            exists = False
            if hasattr(self.client, "collection_exists"):
                exists = bool(self.client.collection_exists(self.collection_name))
            else:
                # Fallback: try to fetch collection info
                self.client.get_collection(self.collection_name)
                exists = True

            if exists:
                return

            self._create_collection()
        except Exception as e:
            logger.error(f"Failed to ensure Qdrant collection '{self.collection_name}': {e}")
            raise

    def _create_collection(self) -> None:
        # Qdrant distance enum mapping
        from qdrant_client.http import models as rest

        distance_map = {
            "cosine": rest.Distance.COSINE,
            "dot": rest.Distance.DOT,
            "euclid": rest.Distance.EUCLID,
            "euclidean": rest.Distance.EUCLID,
        }
        dist = distance_map.get(self.distance, rest.Distance.COSINE)

        self.client.create_collection(
            collection_name=self.collection_name,
            vectors_config=rest.VectorParams(size=self.vector_size, distance=dist),
        )
        logger.info(
            f"Created Qdrant collection '{self.collection_name}' (size={self.vector_size}, distance={dist})"
        )

    @staticmethod
    def _clean_metadata(metadata: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        if not metadata:
            return {}

        clean: Dict[str, Any] = {}
        for key, value in metadata.items():
            if value is None:
                clean[key] = ""
            elif isinstance(value, (str, int, float, bool)):
                clean[key] = value
            else:
                clean[key] = str(value)
        return clean

    def add_vector(
        self,
        id: str,
        vector: List[float],
        metadata: Optional[Dict[str, Any]] = None,
        document: Optional[str] = None,
    ) -> bool:
        try:
            from qdrant_client.http import models as rest

            payload = self._clean_metadata(metadata)
            payload["_document"] = document or ""

            point = rest.PointStruct(id=str(id), vector=vector, payload=payload)
            self.client.upsert(collection_name=self.collection_name, points=[point])
            logger.debug(f"Upserted vector {id} into Qdrant collection '{self.collection_name}'")
            return True
        except Exception as e:
            logger.error(f"Failed to add vector {id} to Qdrant: {e}")
            return False

    def search_vector(self, vector: List[float], limit: int = 10) -> Dict[str, Any]:
        try:
            results = self.client.search(
                collection_name=self.collection_name,
                query_vector=vector,
                limit=limit,
                with_payload=True,
                with_vectors=False,
            )

            ids: List[str] = []
            scores: List[float] = []
            metadatas: List[Dict[str, Any]] = []
            documents: List[str] = []

            for point in results or []:
                ids.append(str(point.id))
                # Qdrant returns "score" (similarity for cosine/dot; lower for euclid depending on API).
                scores.append(float(getattr(point, "score", 0.0)))

                payload = getattr(point, "payload", None) or {}
                documents.append(str(payload.get("_document", "")))

                md = dict(payload)
                md.pop("_document", None)
                metadatas.append(md)

            return {
                "ids": [ids],
                "distances": [scores],
                "metadatas": [metadatas],
                "documents": [documents],
            }
        except Exception as e:
            logger.error(f"Qdrant vector search failed: {e}")
            return {"ids": [[]], "distances": [[]], "metadatas": [[]], "documents": [[]]}
