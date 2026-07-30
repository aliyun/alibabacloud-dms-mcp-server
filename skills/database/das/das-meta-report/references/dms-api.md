# DMS Enterprise API Reference

## Key APIs for Business Knowledge

### GetTableKnowledgeInfo
- **Purpose**: Retrieve table business knowledge and column descriptions
- **Parameters**: 
  - `DbId`: Database ID from SearchDatabase
  - `TableName`: Table name
  - `TableSchemaName`: Schema name (optional)
- **Response**: Contains `AssetDescription`, `Summary`, and `ColumnList` with business descriptions

### SearchDatabase  
- **Purpose**: List databases with business context
- **Parameters**: `Tid` (tenant ID), `SearchKey` (optional)
- **Response**: Returns database list with `Alias`, `Description`, and business metadata

### SearchTable
- **Purpose**: Search tables with business descriptions
- **Parameters**: `Tid`, `SearchKey`
- **Response**: Returns table list with `Description` field containing business meaning

## Authentication
Uses standard Alibaba Cloud AccessKey authentication with RAM permissions:
- `dms-enterprise:SearchDatabase`
- `dms-enterprise:SearchTable` 
- `dms-enterprise:GetTableKnowledgeInfo`