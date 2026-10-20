# Generation Lambda

This package is an un-deployed async generation boundary. It currently uses mock provider and in-memory storage adapters only. The production adapter will invoke Replicate and S3 in a later phase.

The Lambda never receives database credentials or NextAuth cookies. It calls signed root internal endpoints for claim, prediction telemetry, and finalization.
