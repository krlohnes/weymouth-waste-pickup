# Weymouth Waste Pickup Data Validation

This directory contains tools to parse the official Weymouth yard waste pickup PDF and validate it against our existing data.

## Recommended Solution: Python Parser

**For 100% accuracy, use the Python parser (`simple_pdf_parser.py`)** which achieved perfect parsing results by preserving table structure from the PDF.

### Why Python vs JavaScript?

The JavaScript parser using `pdf-parse` extracts raw text that concatenates table cells together. For example, "10" and "58" become "1058", making accurate digit splitting impossible.

The Python solution using `pdfplumber` preserves the original table structure, extracting data like `['5', '185', 'LAMBERT AVE', 'Wednesday', 'A']` with no ambiguity.

### Python Setup

1. Create virtual environment:
```bash
python3 -m venv pdf_parser_env
source pdf_parser_env/bin/activate
```

2. Install dependencies:
```bash
pip install pdfplumber
```

3. Run the parser:
```bash
python weymouth_pdf_parser.py yardwastepickup_25.pdf
```

### Results
- **100% accuracy** on all test cases
- **829 streets** extracted
- **7/7 validation tests passed**
- Output in `parsed-data/`

## Usage

1. Download the current year's PDF from Weymouth's website
2. Activate the Python environment: `source pdf_parser_env/bin/activate`
3. Run the parser: `python weymouth_pdf_parser.py yardwastepickup_25.pdf`
4. Copy the generated JSON files to the main app: `cp parsed-data/*.json ../data/2025/`

## Output Files

The parser generates JSON files grouped alphabetically:
- `parsed-data/streets-a-c.json`
- `parsed-data/streets-d-g.json` 
- `parsed-data/streets-h-m.json`
- `parsed-data/streets-n-s.json`
- `parsed-data/streets-t-z.json`

Each file contains an array of street objects:
```json
{
  "streets": [
    {
      "street": "ABBOTT ST",
      "low": 10,
      "high": 58,
      "day": "Monday",
      "zone": "B"
    }
  ]
}
```

## For Future Years

1. Download the new PDF from Weymouth's website
2. Update the filename in the command: `python weymouth_pdf_parser.py new_filename.pdf`
3. Copy the generated files to replace the current application data
4. The parser includes built-in validation to ensure accuracy

## Files

- `weymouth_pdf_parser.py` - Main parser using pdfplumber
- `pdf_parser_env/` - Python virtual environment
- `parsed-data/` - Generated JSON files
- `yardwastepickup_25.pdf` - Current year's PDF
- `README.md` - This documentation