"""Vector store utilities.

This module keeps the existing ChromaDB-backed `VectorStore` implementation,
and adds a factory `get_vector_store()` that can switch between:
- ChromaDB (local persistent): settings.VECTOR_STORE_BACKEND == "chroma"
- Qdrant (cloud): settings.VECTOR_STORE_BACKEND == "qdrant"
"""

from typing import Any, Dict, List, Optional, Tuple
import os
import logging

from app.config import settings

try:
    import chromadb  # type: ignore
except Exception:
    chromadb = None

logger = logging.getLogger(__name__)


class VectorStore:
    def __init__(self, persist_dir: str = "./chroma_db", collection_name: str = "default"):
        """Initialize a persistent ChromaDB client and collection.

        persist_dir: path where Chroma will store its files (relative to backend working dir)
        collection_name: name of the collection to use/create
        
        Note: This initialization is synchronous and should be done in a background thread
        when called from async contexts.
        """
        try:
            if chromadb is None:
                raise ImportError(
                    "chromadb is not installed. Install it or switch VECTOR_STORE_BACKEND to 'qdrant'."
                )

            os.makedirs(persist_dir, exist_ok=True)
            
            # Use PersistentClient for better persistence
            self.client = chromadb.PersistentClient(path=persist_dir)
            
            # Use a named collection where vectors will be stored
            self.collection = self.client.get_or_create_collection(
                name=collection_name,
                metadata={"hnsw:space": "cosine"}  # Use cosine similarity
            )
            logger.info(f"Initialized ChromaDB collection '{collection_name}' at {persist_dir}")
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB: {e}")
            raise

    def add_vector(self, id: str, vector: List[float], metadata: Optional[Dict[str, Any]] = None, document: Optional[str] = None) -> bool:
        """Add a single vector to the collection.

        id: unique id for the vector (string)
        vector: list of floats
        metadata: optional dict of metadata
        document: optional textual document to attach
        Returns True on success, False on failure.
        """
        try:
            # Convert all metadata values to strings to avoid ChromaDB type issues
            clean_metadata = {}
            if metadata:
                for key, value in metadata.items():
                    if isinstance(value, bool):
                        clean_metadata[key] = str(value).lower()
                    elif value is None:
                        clean_metadata[key] = ""
                    else:
                        clean_metadata[key] = str(value)
            
            self.collection.add(
                ids=[id],
                embeddings=[vector],
                metadatas=[clean_metadata],
                documents=[document or ""],
            )
            logger.debug(f"Added vector {id} to collection")
            return True
        except Exception as e:
            logger.error(f"Failed to add vector {id}: {e}")
            return False

    def search_vector(self, vector: List[float], limit: int = 10) -> Dict[str, Any]:
        """Search the collection for nearest neighbors.

        Returns the raw Chroma query result dict containing ids, distances, metadatas, documents.
        """
        try:
            results = self.collection.query(
                query_embeddings=[vector],
                n_results=limit,
                include=["metadatas", "distances", "documents"],
            )
            logger.debug(f"Vector search returned {len(results.get('ids', [[]])[0])} results")
            return results
        except Exception as e:
            logger.error(f"Vector search failed: {e}")
            return {"ids": [[]], "distances": [[]], "metadatas": [[]], "documents": [[]]}


# Cache instances per backend+collection.
_vector_store_instances: Dict[Tuple[str, str], Any] = {}


def get_vector_store(persist_dir: str = "./chroma_db", collection_name: str = "default") -> Any:
    backend = (getattr(settings, "VECTOR_STORE_BACKEND", "chroma") or "chroma").strip().lower()
    key = (backend, collection_name)
    if key in _vector_store_instances:
        return _vector_store_instances[key]

    if backend == "qdrant":
        from app.services.qdrant_vector_store import QdrantVectorStore

        instance = QdrantVectorStore(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY or None,
            collection_name=collection_name or settings.QDRANT_COLLECTION,
            vector_size=settings.VECTOR_STORE_VECTOR_SIZE,
            distance=settings.VECTOR_STORE_DISTANCE,
        )
    else:
        instance = VectorStore(persist_dir=persist_dir, collection_name=collection_name)

    _vector_store_instances[key] = instance
    return instance
