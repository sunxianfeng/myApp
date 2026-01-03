"""
Vector store utility using ChromaDB persistent client.
Provides a simple wrapper with add_vector and search_vector methods.
"""
from typing import Any, Dict, List, Optional
import os
import logging

import chromadb
from chromadb.config import Settings

logger = logging.getLogger(__name__)


class VectorStore:
    def __init__(self, persist_dir: str = "./chroma_db", collection_name: str = "default"):
        """Initialize a persistent ChromaDB client and collection.

        persist_dir: path where Chroma will store its files (relative to backend working dir)
        collection_name: name of the collection to use/create
        """
        os.makedirs(persist_dir, exist_ok=True)
        self.client = chromadb.Client(Settings(
            chroma_db_impl="duckdb+parquet",
            persist_directory=persist_dir,
        ))
        # Use a named collection where vectors will be stored
        self.collection = self.client.get_or_create_collection(name=collection_name)

    def add_vector(self, id: str, vector: List[float], metadata: Optional[Dict[str, Any]] = None, document: Optional[str] = None) -> bool:
        """Add a single vector to the collection.

        id: unique id for the vector (string)
        vector: list of floats
        metadata: optional dict of metadata
        document: optional textual document to attach
        Returns True on success, False on failure.
        """
        try:
            self.collection.add(
                ids=[id],
                embeddings=[vector],
                metadatas=[metadata or {}],
                documents=[document or ""],
            )
            # Ensure persistence
            try:
                self.client.persist()
            except Exception:
                # Some Chroma client implementations persist automatically; ignore persistence errors
                pass
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
                include=["metadatas", "distances", "ids", "documents"],
            )
            return results
        except Exception as e:
            logger.error(f"Vector search failed: {e}")
            return {"ids": [], "distances": [], "metadatas": [], "documents": []}


# Simple singleton accessor used by other services
_vector_store_instance: Optional[VectorStore] = None


def get_vector_store(persist_dir: str = "./chroma_db", collection_name: str = "default") -> VectorStore:
    global _vector_store_instance
    if _vector_store_instance is None:
        _vector_store_instance = VectorStore(persist_dir=persist_dir, collection_name=collection_name)
    return _vector_store_instance
