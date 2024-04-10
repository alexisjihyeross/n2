# Script for formatting data
import pandas as pd
from tqdm import tqdm


def load_file(file_path):
    """
    Load a file from the given path
    """
    data = pd.read_csv(file_path, sep=",", encoding="latin-1", dtype=str)

    return data


def map_sector(row):
    # given a dataframe row, return the text mapping of the sector code

    sector_code = row["naics"]

    assert sector_code[-4:] == "----", f"Unexpected NAICS code: {sector_code}"

    sector_code = sector_code[:2]

    sector_map = {
        11: "Agriculture, Forestry, Fishing and Hunting",
        21: "Mining, Quarrying, and Oil and Gas Extraction",
        22: "Utilities",
        23: "Construction",
        31: "Manufacturing",
        32: "Manufacturing",
        33: "Manufacturing",
        42: "Wholesale Trade",
        44: "Retail Trade",
        45: "Retail Trade",
        48: "Transportation and Warehousing",
        49: "Transportation and Warehousing",
        51: "Information",
        52: "Finance and Insurance",
        53: "Real Estate and Rental and Leasing",
        54: "Professional, Scientific, and Technical Services",
        55: "Management of Companies and Enterprises",
        56: "Administrative and Support and Waste Management and Remediation Services",
        61: "Educational Services",
        62: "Health Care and Social Assistance",
        71: "Arts, Entertainment, and Recreation",
        72: "Accommodation and Food Services",
        81: "Other Services (except Public Administration)",
        92: "Public Administration",
        99: "Unclassified",  # TODO: check this
    }

    assert int(sector_code) in sector_map, f"Unexpected sector code: {sector_code}"

    return sector_map[int(sector_code)]


if __name__ == "__main__":

    zip_codes = ["02109", "02125", "02127", "02118", "02128", "02228"]

    zip_code_to_neighborhood = {
        "02109": "South Boston",
        "02125": "South Boston",
        "02127": "South Boston",
        "02118": "South End",
        "02128": "East Boston",
        "02228": "East Boston",
    }

    dataframes = []
    print("Loading files...")
    for year in tqdm(range(10, 22)):
        file_path = f"data/zbp{year}detail.txt"
        data = load_file(file_path)
        data["year"] = 2000 + year

        # only keep data for the zip codes we are interested in
        data = data[data["zip"].isin(zip_codes)]

        # for now, filter to naics codes that are 2 digits followed by 4 dashes (these are the sector-level codes): https://www.census.gov/programs-surveys/economic-census/year/2022/guidance/understanding-naics.html

        data = data[data["naics"].str.match(r"\d{2}----")]

        # map the sector code to a text description
        data["sector"] = data.apply(map_sector, axis=1)

        # map n<5 col to n1_4
        data = data.rename(columns={"n<5": "n1_4"})

        # add neighborhood column
        data["neighborhood"] = data["zip"].map(zip_code_to_neighborhood)

        dataframes.append(data)
    print("Done.")

    data = pd.concat(dataframes)

    # breakpoint()

    # sum up the data in each neighborhood if the sector/year are the same. columns to sum: est, n1_4, n5_9, n10_19, n20_49, n50_99, n100_249, n250_499, n500_999, n1000
    cols_to_sum = [
        "est",
        "n1_4",
        "n5_9",
        "n10_19",
        "n20_49",
        "n50_99",
        "n100_249",
        "n250_499",
        "n500_999",
        "n1000",
    ]

    # cast as int
    for col in cols_to_sum:
        # map "N" to 0
        data[col] = data[col].replace("N", 0)
        data[col] = data[col].astype(int)

    new_data = {}
    for year in data["year"].unique():
        for neighborhood in data["neighborhood"].unique():
            for sector in data["sector"].unique():
                mask = (
                    (data["year"] == year)
                    & (data["neighborhood"] == neighborhood)
                    & (data["sector"] == sector)
                )
                if mask.sum() > 0:
                    row = data[mask].sum()
                    new_data[(year, neighborhood, sector)] = row[cols_to_sum]

    new_data = pd.DataFrame(new_data).T
    new_data.reset_index(inplace=True)
    new_data.columns = ["year", "neighborhood", "sector"] + cols_to_sum

    print("Saving data...")
    out_file = "data/all_data.csv"
    new_data.to_csv(out_file, index=False)
    print(f"Data saved to {out_file}.")
