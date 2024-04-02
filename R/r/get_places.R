key <- "AIzaSyASYqIg0LimDB_uaDTsN9sbnjqFXUHK8sI"

find_places <- function(area, page = 1, key) {
  res2 <- NULL
  res3 <- NULL
  res1 <- googleway::google_places(
    search_string = paste(area, "coffee", spe = " "),
    key = key
  )
  # next_page_token will be available after several seconds
  # res2 will be null if not waiting several seconds here.
  Sys.sleep(3)
  if (page >= 2) {
    res2 <- googleway::google_places(
      search_string = paste(area, "coffee", spe = " "),
      page_token = res1$next_page_token,
      key = key
    )
  }
  Sys.sleep(3)
  if (page >= 3) {
    res3 <- googleway::google_places(
      search_string = paste(area, "coffee", spe = " "),
      page_token = res2$next_page_token,
      key = key
    )
  }
  rbind(res_df(res1), res_df(res2), res_df(res3))
}

res_df <- function(res) {
  if (is.null(res)) {
    return(tibble::tibble(
      address = character(),
      lat = numeric(),
      lon = numeric(),
      name = character(),
      rating = numeric(),
      num_rating = integer()
    ))
  }
  results <- res$results
  df <- tibble::tibble(
    address = results$formatted_address,
    lat = results$geometry$location$lat,
    lon = results$geometry$location$lng,
    name = results$name,
    rating = results$rating,
    num_rating = results$user_ratings_total
  )
}

res1 <- googleway::google_places(
  search_string = paste("Utrecht", "coffee", spe = " "),
  key = key)

places <- find_places(area="Amsterdam", page=2,key)

res1$results$place_id
